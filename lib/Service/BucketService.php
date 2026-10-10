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
        if ($offset === 0) { array_unshift($rows, ['id' => $root['id'], 'name' => $root['name'] ?: 'Library', 'is_default' => true]); }
        return ['buckets' => $rows, 'has_more' => $more, 'offset' => $offset];
    }
    public function create(string $owner, string $name): array {
        NodeRules::name($name); $root = $this->vfs->root($owner);
        return $this->nodes->transaction($owner, $root['id'], function () use ($owner, $name) {
            if ($name === 'Library' || $name === ($this->vfs->root($owner)['name'] ?: 'Library') || $this->buckets->exists($owner, $name)) { throw new MediaException('Bucket name already exists.', 409); }
            $id = bin2hex(random_bytes(16)); $now = time();
            $this->nodes->insert(['id' => $id, 'owner_id' => $owner, 'parent_id' => '', 'name' => $name,
                'name_key' => hash('sha256', 'mediastorage-bucket:' . $owner . ':' . $name), 'node_type' => 'bucket',
                'created_at' => $now, 'updated_at' => $now, 'lock_version' => 0]);
            $this->buckets->insert(['id' => $id, 'owner_id' => $owner, 'name' => $name, 'name_key' => hash('sha256', $name), 'created_at' => $now]);
            return ['id' => $id, 'name' => $name, 'is_default' => false];
        });
    }
    public function rename(string $owner, string $id, string $name): array {
        NodeRules::name($name); $root = $this->vfs->root($owner);
        return $this->nodes->transaction($owner, $root['id'], function () use ($owner, $id, $name) {
            $node = $this->bucket($owner, $id); $default = $node['node_type'] === 'root';
            $current = $node['name'] ?: 'Library';
            if ($name !== $current && ($this->buckets->exists($owner, $name)
                || (!$default && ($name === 'Library' || $name === ($this->vfs->root($owner)['name'] ?: 'Library'))))) {
                throw new MediaException('Bucket name already exists.', 409);
            }
            $values = ['name' => $name, 'updated_at' => time()];
            if (!$default) { $values['name_key'] = hash('sha256', 'mediastorage-bucket:' . $owner . ':' . $name); }
            $this->nodes->update($owner, $id, $values);
            if (!$default) { $this->buckets->rename($owner, $id, $name); }
            return ['id' => $id, 'name' => $name, 'is_default' => $default];
        });
    }
    private function bucket(string $owner, string $id): array {
        $node = $this->nodes->get($owner, $id);
        if (!in_array($node['node_type'], ['root', 'bucket'], true)) { throw new MediaException('Bucket not found.', 404); }
        return $node;
    }
    /** Collect before mutating so bounds/cycle failures cannot partially clear data. */
    private function subtree(string $owner, string $id): array {
        $queue = [$id]; $ids = [];
        while ($queue) {
            $current = array_pop($queue);
            if (isset($ids[$current]) || count($ids) >= 1000) { throw new MediaException('Bucket exceeds the 1000-node limit. Remove smaller virtual folders first.', 409); }
            $ids[$current] = true;
            foreach ($this->nodes->children($owner, $current, '', 1001) as $child) { $queue[] = $child['id']; }
        }
        return array_reverse(array_keys($ids));
    }
    public function clear(string $owner, string $id): void {
        $root = $this->vfs->root($owner);
        $this->nodes->transaction($owner, $root['id'], function () use ($owner, $id) {
            $this->bucket($owner, $id);
            foreach ($this->subtree($owner, $id) as $nodeId) {
                if ($nodeId !== $id) { $this->nodes->remove($owner, $nodeId); }
            }
        });
    }
    /** Remove app-owned metadata only; never delete physical Nextcloud files. */
    public function destroy(string $owner, string $id): void {
        $root = $this->vfs->root($owner);
        $this->nodes->transaction($owner, $root['id'], function () use ($owner, $id) {
            $node = $this->bucket($owner, $id);
            if ($node['node_type'] === 'root') { throw new MediaException('Default bucket cannot be removed.', 403); }
            foreach ($this->subtree($owner, $id) as $nodeId) { $this->nodes->remove($owner, $nodeId); }
            $this->buckets->remove($owner, $id);
        });
    }
}
