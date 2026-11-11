<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Db\BucketStore;
use OCA\MediaStorage\Exception\MediaException;
/** Path lookup and stream preparation always run inside the verified token's owner lock. */
final class PathMediaService {
    public function __construct(private ScopedApiService $api, private NodeStore $nodes,
        private BucketStore $buckets, private VirtualFileSystemService $vfs,
        private MediaStorageService $storage, private TemporaryAccessService $access,
        private DeliveryProtectionService $protection) {}
    private function resolve(array $token, string $path, ?string $bucket): array {
        if (strlen($path) > 32768) { throw new MediaException('Virtual path is too long.'); }
        $segments = NodeRules::segments($path);
        if (!$segments || count($segments) >= 128) { throw new MediaException('Invalid media path.'); }
        $owner = $token['owner_id'];
        if ($token['folder_id'] !== null) {
            if ($bucket !== null) { throw new MediaException('Omit bucket when using a restricted token.'); }
            $node = $this->nodes->get($owner, $token['folder_id']);
        } else {
            $node = $this->vfs->root($owner);
            if ($bucket !== null) {
                NodeRules::name($bucket);
                if ($bucket !== ($node['name'] ?: 'Library')) {
                    $found = $this->buckets->findByName($owner, $bucket) ?? throw new MediaException('Bucket not found.', 404);
                    $node = $this->nodes->get($owner, $found['id']);
                }
            }
        }
        foreach ($segments as $name) {
            if (!in_array($node['node_type'], ['root', 'bucket', 'folder'], true)) { throw new MediaException('Media reference not found.', 404); }
            $node = $this->nodes->sibling($owner, $node['id'], $name) ?? throw new MediaException('Media reference not found.', 404);
        }
        $this->api->contains($token, $node['id']);
        if ($node['node_type'] !== 'media') { throw new MediaException('Path is not a media reference.', 404); }
        return $node;
    }
    public function issue(string $header, string $path, ?string $bucket, ?int $ttl): array {
        return $this->api->access($header, 'media:read', function ($token) use ($path, $bucket, $ttl) {
            $node = $this->resolve($token, $path, $bucket);
            return $this->access->issue($token['owner_id'], $node['id'], $ttl, $token);
        });
    }
    public function read(string $header, string $path, ?string $bucket, bool $head, array $conditions): array {
        $result = null;
        try {
            return $this->api->access($header, 'media:read', function ($token) use ($path, $bucket, $head, $conditions, &$result) {
                $node = $this->resolve($token, $path, $bucket);
                $binding = $this->nodes->binding($token['owner_id'], $node['id']);
                if (!$binding) { throw new MediaException('Media reference not available.', 404); }
                $file = $this->storage->file($token['owner_id'], (int)$binding['nextcloud_file_id'], $binding);
                $identity = hash('sha256', 'bearer-path:' . $token['id'] . ':' . $node['id']);
                $row = ['id' => $identity, 'owner_id' => $token['owner_id'], 'issuer_id' => $token['id']];
                $this->protection->resource($row);
                $metadata = ['name' => $node['name'], 'mime' => $file->getMimeType(), 'size' => (int)$file->getSize(),
                    'mtime' => (int)$file->getMTime(), 'etag' => hash('sha256', $identity . ':' . $file->getEtag())];
                $result = $metadata + DeliveryRules::plan($metadata, $conditions, $head);
                if ($result['body']) {
                    $result += $this->protection->lease($row);
                    $result['stream'] = $file->fopen('rb');
                    if (!is_resource($result['stream'])) { throw new MediaException('Media stream unavailable.', 503); }
                    if ($result['offset'] > 0 && fseek($result['stream'], $result['offset']) !== 0) { throw new MediaException('Media seeking unavailable.', 503); }
                }
                return $result;
            });
        } catch (\Throwable $error) {
            if (is_resource($result['stream'] ?? null)) { fclose($result['stream']); }
            if (isset($result['release'])) { ($result['release'])(); }
            throw $error;
        }
    }
}
