<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCA\MediaStorage\Db\TokenStore;
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Exception\MediaException;
use OCP\IUserManager;
use OCP\IConfig;
final class ApiTokenService {
    public const SCOPES = ['media:read', 'media:upload', 'media:manage', 'media:delete', 'token:manage'];
    public function __construct(private TokenStore $tokens, private NodeStore $nodes, private VirtualFileSystemService $vfs,
        private IUserManager $users, private IConfig $config) {}
    private function owner(string $owner): void {
        if ($owner === '' || strlen($owner) > 64 || !($this->users->get($owner)?->isEnabled() ?? false)) {
            throw new MediaException('Authentication required.', 401);
        }
    }
    public function locked(string $owner, callable $action): mixed {
        $this->owner($owner);
        $root = $this->vfs->root($owner);
        return $this->nodes->transaction($owner, $root['id'], function () use ($owner, $action) {
            $this->owner($owner); return $action();
        });
    }
    private function owned(string $owner, string $id): array {
        $token = $this->tokens->find($id);
        if (!$token || $token['owner_id'] !== $owner) { throw new MediaException('Token not found.', 404); }
        return $token;
    }
    public function issue(string $owner, string $name, array $scopes, int $expiresAt, ?string $folderId = null): array {
        if (trim($name) === '' || trim($name) !== $name || strlen($name) > 100 || preg_match('//u', $name) !== 1 || preg_match('/[\x00-\x1f\x7f]/', $name)) {
            throw new MediaException('Invalid token name.');
        }
        if (!$scopes || count($scopes) > count(self::SCOPES) || count(array_unique($scopes, SORT_REGULAR)) !== count($scopes)) {
            throw new MediaException('Invalid token scopes.');
        }
        foreach ($scopes as $scope) { if (!is_string($scope) || !in_array($scope, self::SCOPES, true)) { throw new MediaException('Invalid token scopes.'); } }
        $max = max(60, min(31536000, (int)$this->config->getAppValue('mediastorage', 'max_token_lifetime', '31536000')));
        if ($expiresAt <= time() || $expiresAt > time() + $max) { throw new MediaException('Token expiration exceeds allowed lifetime.'); }
        if ($folderId !== null && in_array('token:manage', $scopes, true)) {
            throw new MediaException('Token management requires an owner-wide token.');
        }
        return $this->locked($owner, function () use ($owner, $name, $scopes, $expiresAt, $folderId) {
            if ($folderId !== null) {
                $folder = $this->nodes->get($owner, $folderId);
                if (!in_array($folder['node_type'], ['root', 'folder'], true)) { throw new MediaException('Token restriction must be a folder.', 409); }
            }
            $id = bin2hex(random_bytes(16)); $secret = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
            $row = ['id' => $id, 'owner_id' => $owner, 'name' => $name, 'token_hash' => hash('sha256', $secret),
                'scopes' => json_encode(array_values($scopes), JSON_THROW_ON_ERROR), 'folder_id' => $folderId,
                'expires_at' => $expiresAt, 'revoked_at' => null, 'created_at' => time(), 'last_used_at' => null];
            $this->tokens->insert($row);
            return ['token' => $this->publicToken($row), 'secret' => 'ms_' . $id . '.' . $secret];
        });
    }
    public function publicToken(array $row): array {
        unset($row['token_hash']);
        $row['scopes'] = json_decode($row['scopes'], true, 8, JSON_THROW_ON_ERROR);
        foreach (['created_at', 'expires_at', 'revoked_at', 'last_used_at'] as $field) { $row[$field] = $row[$field] === null ? null : (int)$row[$field]; }
        $row['status'] = $row['revoked_at'] !== null ? 'revoked' : ($row['expires_at'] <= time() ? 'expired' : 'active');
        return $row;
    }
    public function listing(string $owner, int $limit = 100, int $offset = 0): array {
        $this->owner($owner);
        if ($limit < 1 || $limit > 100 || $offset < 0) { throw new MediaException('Invalid pagination.'); }
        return array_map($this->publicToken(...), $this->tokens->listing($owner, $limit, $offset));
    }
    public function revoke(string $owner, string $id): void {
        $this->locked($owner, function () use ($owner, $id) {
            $row = $this->owned($owner, $id);
            if ($row['revoked_at'] === null) { $this->tokens->update($owner, $id, ['revoked_at' => time()]); }
        });
    }
    /** Create a replacement; the old credential remains active until explicitly revoked. */
    public function rotate(string $owner, string $id): array {
        return $this->locked($owner, function () use ($owner, $id) {
            $row = $this->owned($owner, $id);
            if ($this->publicToken($row)['status'] !== 'active') { throw new MediaException('Only active tokens can be rotated.', 409); }
            return $this->issue($owner, $row['name'], json_decode($row['scopes'], true, 8, JSON_THROW_ON_ERROR), (int)$row['expires_at'], $row['folder_id']);
        });
    }
    public function authenticate(string $header): array {
        if (!preg_match('/^Bearer ms_([a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/D', $header, $match)) { throw new MediaException('Invalid API credentials.', 401); }
        $row = $this->tokens->find($match[1]);
        $expected = $row['token_hash'] ?? str_repeat('0', 64);
        if (!hash_equals($expected, hash('sha256', $match[2])) || !$row || $row['revoked_at'] !== null || (int)$row['expires_at'] <= time()) {
            throw new MediaException('Invalid API credentials.', 401);
        }
        $this->owner($row['owner_id']);
        return $row;
    }
    public function used(array $row): void { $this->tokens->update($row['owner_id'], $row['id'], ['last_used_at' => time()]); }
}
