<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCA\MediaStorage\Db\AccessStore;
use OCA\MediaStorage\Db\TokenStore;
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Exception\MediaException;
use OCP\IConfig;
final class TemporaryAccessService {
    public function __construct(private AccessStore $access, private NodeStore $nodes, private TokenStore $tokenStore,
        private ApiTokenService $tokens, private ScopedApiService $api, private MediaStorageService $storage, private IConfig $config) {}
    public function policy(): array {
        $maximum = max(60, min(86400, (int)$this->config->getAppValue('mediastorage', 'max_access_lifetime', '3600')));
        return ['server_time' => time(), 'default_ttl_seconds' => min(900, $maximum), 'max_ttl_seconds' => $maximum];
    }
    private function metadata(array $row): array {
        $result = array_intersect_key($row, array_flip(['id', 'node_id', 'created_at', 'expires_at', 'revoked_at']));
        foreach (['created_at', 'expires_at', 'revoked_at'] as $key) { $result[$key] = $result[$key] === null ? null : (int)$result[$key]; }
        $result['status'] = $result['revoked_at'] !== null ? 'revoked' : ($result['expires_at'] <= time() ? 'expired' : 'active');
        return $result;
    }
    private function bucket(string $owner, string $id): string {
        $seen = [];
        while (count($seen) < 128 && !isset($seen[$id])) {
            $seen[$id] = true; $node = $this->nodes->get($owner, $id);
            if (in_array($node['node_type'], ['root', 'bucket'], true)) { return $node['id']; }
            $id = $node['parent_id'];
        }
        throw new MediaException('Invalid resource hierarchy.', 409);
    }
    private function resource(string $owner, string $id): array {
        $node = $this->nodes->get($owner, $id); $binding = $this->nodes->binding($owner, $id);
        if ($node['node_type'] !== 'media' || !$binding) { throw new MediaException('Media reference not available.', 404); }
        $file = $this->storage->file($owner, (int)$binding['nextcloud_file_id'], $binding);
        return [$node, $binding, $file];
    }
    /** Caller holds the same owner lock as credential and hierarchy mutations. */
    private function issuer(array $token, string $id): void {
        if ($token['revoked_at'] !== null || (int)$token['expires_at'] <= time()
            || !in_array('media:read', json_decode($token['scopes'], true, 8, JSON_THROW_ON_ERROR), true)) {
            throw new MediaException('Issuer is no longer authorized.', 403);
        }
        $this->api->contains($token, $id);
    }
    public function issue(string $owner, string $id, ?int $ttl = null, ?array $issuer = null): array {
        return $this->tokens->locked($owner, function () use ($owner, $id, $ttl, $issuer) {
            $policy = $this->policy(); $ttl ??= $policy['default_ttl_seconds'];
            if ($ttl < 1 || $ttl > $policy['max_ttl_seconds']) { throw new MediaException('Temporary access lifetime must be between 1 and ' . $policy['max_ttl_seconds'] . ' seconds.'); }
            $now = time(); $expires = $now + $ttl;
            if ($issuer !== null) {
                $issuer = $this->tokenStore->find($issuer['id']);
                if (!$issuer || $issuer['owner_id'] !== $owner) { throw new MediaException('Issuer is no longer authorized.', 403); }
                $this->issuer($issuer, $id); $expires = min($expires, (int)$issuer['expires_at']);
            }
            [, $binding, $file] = $this->resource($owner, $id);
            $secret = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
            $row = ['id' => bin2hex(random_bytes(16)), 'owner_id' => $owner, 'node_id' => $id,
                'bucket_id' => $this->bucket($owner, $id), 'secret_hash' => hash('sha256', $secret),
                'file_id' => (int)$binding['nextcloud_file_id'], 'storage_reference' => $binding['storage_reference'],
                'file_etag' => $file->getEtag(), 'issuer_id' => $issuer['id'] ?? null,
                'created_at' => $now, 'expires_at' => $expires, 'revoked_at' => null];
            $this->access->insert($row);
            return ['access' => $this->metadata($row), 'key' => $secret];
        });
    }
    public function listing(string $owner, string $node, int $limit = 100, int $offset = 0): array {
        return $this->tokens->locked($owner, function () use ($owner, $node, $limit, $offset) {
            if ($limit < 1 || $limit > 100 || $offset < 0) { throw new MediaException('Invalid pagination.'); }
            $this->nodes->get($owner, $node);
            return ['access' => array_map($this->metadata(...), $this->access->listing($owner, $node, $limit, $offset)), 'policy' => $this->policy()];
        });
    }
    public function revoke(string $owner, string $id, ?array $issuer = null): void {
        $this->tokens->locked($owner, function () use ($owner, $id, $issuer) {
            $row = $this->access->find($id);
            if (!$row || $row['owner_id'] !== $owner) { throw new MediaException('Temporary access not found.', 404); }
            if ($issuer !== null) {
                if ($row['issuer_id'] !== $issuer['id']) { throw new MediaException('Temporary access not found.', 404); }
                $this->issuer($issuer, $row['node_id']);
            }
            $this->access->revoke($owner, $id, time());
        });
    }
    /** Authorize and open inside the lock; never cache authorization across requests. */
    public function read(string $id, string $key, bool $head = false): array {
        $unavailable = fn() => new MediaException('Temporary access not available.', 404);
        if (!preg_match('/^[a-f0-9]{32}$/D', $id) || !preg_match('/^[A-Za-z0-9_-]{43}$/D', $key)) { throw $unavailable(); }
        $initial = $this->access->find($id);
        $expected = $initial['secret_hash'] ?? str_repeat('0', 64);
        if (!hash_equals($expected, hash('sha256', $key)) || !$initial) { throw $unavailable(); }
        try {
            return $this->tokens->locked($initial['owner_id'], function () use ($id, $key, $head, $unavailable) {
                $row = $this->access->find($id);
                if (!$row || !hash_equals($row['secret_hash'], hash('sha256', $key)) || $row['revoked_at'] !== null || (int)$row['expires_at'] <= time()) { throw $unavailable(); }
                if ($row['issuer_id'] !== null) {
                    $issuer = $this->tokenStore->find($row['issuer_id']);
                    if (!$issuer || $issuer['owner_id'] !== $row['owner_id']) { throw $unavailable(); }
                    $this->issuer($issuer, $row['node_id']);
                }
                [$node, $binding, $file] = $this->resource($row['owner_id'], $row['node_id']);
                if ((int)$binding['nextcloud_file_id'] !== (int)$row['file_id']
                    || !hash_equals($row['storage_reference'], $binding['storage_reference'])
                    || !hash_equals($row['file_etag'], $file->getEtag())
                    || $this->bucket($row['owner_id'], $row['node_id']) !== $row['bucket_id']) { throw $unavailable(); }
                $result = ['name' => $node['name'], 'mime' => $file->getMimeType(), 'size' => (int)$file->getSize(), 'stream' => null];
                if (!$head) {
                    $result['stream'] = $file->fopen('rb');
                    if (!is_resource($result['stream'])) { throw new MediaException('Media stream unavailable.', 503); }
                }
                return $result;
            });
        } catch (MediaException $error) {
            if ($error->status === 503) { throw $error; }
            throw $unavailable();
        }
    }
}
