<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCA\MediaStorage\Db\BucketStore;
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Exception\MediaException;
final class BucketService {
    public function __construct(private BucketStore $buckets, private NodeStore $nodes, private VirtualFileSystemService $vfs) {}
    public function listing(string $owner, int $offset = 0): array {
        if ($offset < 0) { throw new MediaException('Invalid bucket offset.'); }
        $root = $this->vfs->root($owner);
        $rows = $this->buckets->listing($owner, 101, $offset); $more = count($rows) > 100;
        $rows = array_map(fn($row) => $row + ['is_default' => false], array_slice($rows, 0, 100));
        if ($offset === 0) { array_unshift($rows, ['id' => $root['id'], 'name' => 'Library', 'is_default' => true]); }
        return ['buckets' => $rows, 'has_more' => $more, 'offset' => $offset];
    }
    public function create(string $owner, string $name): array {
        NodeRules::name($name); $root = $this->vfs->root($owner);
        return $this->nodes->transaction($owner, $root['id'], function () use ($owner, $name) {
            if ($name === 'Library' || $this->buckets->exists($owner, $name)) { throw new MediaException('Bucket name already exists.', 409); }
            $id = bin2hex(random_bytes(16)); $now = time();
            $this->nodes->insert(['id' => $id, 'owner_id' => $owner, 'parent_id' => '', 'name' => $name,
                'name_key' => hash('sha256', 'mediastorage-bucket:' . $owner . ':' . $name), 'node_type' => 'bucket',
                'created_at' => $now, 'updated_at' => $now, 'lock_version' => 0]);
            $this->buckets->insert(['id' => $id, 'owner_id' => $owner, 'name' => $name, 'name_key' => hash('sha256', $name), 'created_at' => $now]);
            return ['id' => $id, 'name' => $name, 'is_default' => false];
        });
    }
}
