<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Exception\MediaException;
final class VirtualFileSystemService {
    private const MAX_DEPTH = 128;
    private const MAX_DELETE = 1000;
    public function __construct(private NodeStore $store, private MediaStorageService $storage) {}
    public function root(string $owner): array {
        if ($owner === '' || strlen($owner) > 64) { throw new MediaException('Invalid owner.', 403); }
        $id = hash('sha256', 'mediastorage-root:' . $owner);
        try { return $this->store->get($owner, $id); }
        catch (MediaException $e) { if ($e->status !== 404) { throw $e; } }
        $row = ['id' => $id, 'owner_id' => $owner, 'parent_id' => '', 'name' => '',
            'name_key' => hash('sha256', $owner), 'node_type' => 'root', 'created_at' => time(), 'updated_at' => time(), 'lock_version' => 0];
        try { $this->store->insert($row); }
        catch (\OCP\DB\Exception $e) {
            // A concurrent first request may have created the deterministic root.
            try { return $this->store->get($owner, $id); } catch (MediaException) { throw $e; }
        }
        return $row;
    }
    private function mutate(string $owner, callable $action): mixed {
        $root = $this->root($owner);
        return $this->store->transaction($owner, $root['id'], $action);
    }
    private function folder(string $owner, string $id): array {
        $node = $this->store->get($owner, $id);
        if (!in_array($node['node_type'], ['root', 'bucket', 'folder'], true)) { throw new MediaException('Parent must be a folder.', 409); }
        return $node;
    }
    public function listing(string $owner, ?string $parent = null, string $search = '', int $limit = 100, int $offset = 0): array {
        if ($limit < 1 || $limit > 100 || $offset < 0 || strlen($search) > 255) { throw new MediaException('Invalid pagination or search.'); }
        $root = $this->root($owner);
        if ($search === '' || $parent !== null) { $parent ??= $root['id']; $this->folder($owner, $parent); }
        return ['root_id' => $root['id'], 'parent_id' => $parent,
            'nodes' => $this->store->children($owner, $parent, $search, $limit, $offset), 'limit' => $limit, 'offset' => $offset];
    }
    public function objectPage(string $owner, ?string $parent, string $search, string $sort, int $limit, int $offset, ?int $revision): array {
        if ($limit < 1 || $limit > 25 || $offset < 0 || strlen($search) > 255 || !in_array($sort, ['name', 'type'], true)
            || ($offset > 0 && $revision === null) || ($revision !== null && $revision < 0)) { throw new MediaException('Invalid object page.'); }
        $root = $this->root($owner); $parent ??= $root['id']; $this->folder($owner, $parent);
        $current = (int)$root['lock_version'];
        if ($revision !== null && $revision !== $current) { throw new MediaException('This collection changed. Reload objects to continue.', 409); }
        $data = $this->store->objectPage($owner, $parent, $search, $sort, $limit, $offset);
        if ((int)$this->store->get($owner, $root['id'])['lock_version'] !== $current) { throw new MediaException('This collection changed. Reload objects to continue.', 409); }
        $next = $offset + count($data['nodes']);
        return $data + ['root_id' => $root['id'], 'parent_id' => $parent, 'revision' => $current,
            'limit' => $limit, 'offset' => $offset, 'next_offset' => $next, 'has_more' => $next < $data['total']];
    }
    public function create(string $owner, string $name, ?string $parent = null, ?int $fileId = null): array {
        NodeRules::name($name);
        return $this->mutate($owner, function () use ($owner, $name, $parent, $fileId) {
            $parent ??= $this->root($owner)['id']; $this->folder($owner, $parent);
            $this->checkDepth($owner, $parent, 1);
            if ($this->store->sibling($owner, $parent, $name)) { throw new MediaException('Sibling name already exists.', 409); }
            $binding = $fileId !== null ? $this->storage->inspect($owner, $fileId) : null;
            $node = ['id' => bin2hex(random_bytes(16)), 'owner_id' => $owner, 'parent_id' => $parent, 'name' => $name,
                'name_key' => hash('sha256', $name), 'node_type' => $binding ? 'media' : 'folder',
                'created_at' => time(), 'updated_at' => time(), 'lock_version' => 0];
            $this->store->insert($node);
            if ($binding) { $this->store->putBinding($owner, $node['id'], $binding + ['created_at' => time()]); }
            return $node;
        });
    }
    /** Call under the owner lock before a new physical upload is added. */
    public function validateCreation(string $owner, string $name, string $parent): void {
        NodeRules::name($name); $this->folder($owner, $parent); $this->checkDepth($owner, $parent, 1);
        if ($this->store->sibling($owner, $parent, $name)) { throw new MediaException('Sibling name already exists.', 409); }
    }
    private function checkDepth(string $owner, string $parent, int $extra): void {
        $seen = [];
        while ($parent !== '') {
            if (isset($seen[$parent]) || count($seen) + $extra >= self::MAX_DEPTH) { throw new MediaException('Hierarchy is too deep or cyclic.', 409); }
            $seen[$parent] = true; $parent = $this->store->get($owner, $parent)['parent_id'];
        }
    }
    public function update(string $owner, string $id, ?string $name, ?string $parent): array {
        if ($name === null && $parent === null) { throw new MediaException('Provide name or parent_id.'); }
        if ($name !== null) { NodeRules::name($name); }
        return $this->mutate($owner, function () use ($owner, $id, $name, $parent) {
            $node = $this->store->get($owner, $id);
            if (in_array($node['node_type'], ['root', 'bucket'], true)) { throw new MediaException('Root cannot be changed.', 403); }
            $name ??= $node['name']; $parent ??= $node['parent_id']; $this->folder($owner, $parent);
            $cursor = $parent; $seen = [];
            while ($cursor !== '') {
                if ($cursor === $id || isset($seen[$cursor]) || count($seen) >= self::MAX_DEPTH) { throw new MediaException('Circular or excessive hierarchy.', 409); }
                $seen[$cursor] = true; $cursor = $this->store->get($owner, $cursor)['parent_id'];
            }
            // Bound the deepest descendant after a move, not only the moved node.
            $height = 1; $queue = [[$id, 1]]; $visited = [];
            while ($queue) {
                [$current, $depth] = array_pop($queue);
                if (isset($visited[$current]) || count($visited) >= self::MAX_DELETE) { throw new MediaException('Subtree exceeds mutation limit.', 409); }
                $visited[$current] = true; $height = max($height, $depth);
                foreach ($this->store->children($owner, $current, '', self::MAX_DELETE + 1) as $child) { $queue[] = [$child['id'], $depth + 1]; }
            }
            $this->checkDepth($owner, $parent, $height);
            $other = $this->store->sibling($owner, $parent, $name);
            if ($other && $other['id'] !== $id) { throw new MediaException('Sibling name already exists.', 409); }
            $values = ['name' => $name, 'name_key' => hash('sha256', $name), 'parent_id' => $parent, 'updated_at' => time()];
            $this->store->update($owner, $id, $values); return array_replace($node, $values);
        });
    }
    public function destroy(string $owner, string $id): void {
        $this->mutate($owner, function () use ($owner, $id) {
            if (in_array($this->store->get($owner, $id)['node_type'], ['root', 'bucket'], true)) { throw new MediaException('Root cannot be deleted.', 403); }
            $queue = [$id]; $ids = [];
            while ($queue) {
                $current = array_pop($queue);
                if (isset($ids[$current]) || count($ids) >= self::MAX_DELETE) { throw new MediaException('Subtree exceeds deletion limit.', 409); }
                $ids[$current] = true;
                foreach ($this->store->children($owner, $current, '', self::MAX_DELETE + 1) as $child) { $queue[] = $child['id']; }
            }
            foreach (array_reverse(array_keys($ids)) as $nodeId) { $this->store->remove($owner, $nodeId); }
        });
    }
    public function resolve(string $owner, string $path): array {
        $node = $this->root($owner);
        $segments = NodeRules::segments($path);
        if (count($segments) >= self::MAX_DEPTH) { throw new MediaException('Path is too deep.'); }
        foreach ($segments as $name) {
            $node = $this->store->sibling($owner, $node['id'], $name) ?? throw new MediaException('Node not found.', 404);
        }
        return $node;
    }
    public function show(string $owner, string $id): array {
        $node = $this->store->get($owner, $id); $parts = []; $cursor = $node; $seen = [];
        while (!in_array($cursor['node_type'], ['root', 'bucket'], true)) {
            if (isset($seen[$cursor['id']]) || count($seen) >= self::MAX_DEPTH) { throw new MediaException('Invalid hierarchy.', 409); }
            $seen[$cursor['id']] = true; $parts[] = $cursor['name']; $cursor = $this->store->get($owner, $cursor['parent_id']);
        }
        $node['virtual_path'] = '/' . implode('/', array_reverse($parts));
        if ($node['node_type'] === 'media') {
            $binding = $this->store->binding($owner, $id);
            try {
                if (!$binding) { throw new MediaException('Missing binding.', 409); }
                $node['binding'] = $this->storage->inspect($owner, (int)$binding['nextcloud_file_id'], $binding);
                $node['binding_status'] = 'available';
            } catch (MediaException) { $node['binding_status'] = 'needs_rebind'; }
        }
        return $node;
    }
    /** Copy virtual metadata only; validate every binding before committing. */
    public function copy(string $owner, string $id, string $parent, ?string $name = null): array {
        return $this->mutate($owner, function () use ($owner, $id, $parent, $name) {
            $source = $this->store->get($owner, $id); $this->folder($owner, $parent);
            if (in_array($source['node_type'], ['root', 'bucket'], true)) { throw new MediaException('Bucket roots cannot be copied.', 403); }
            $name ??= $source['name']; NodeRules::name($name);
            if ($this->store->sibling($owner, $parent, $name)) { throw new MediaException('Sibling name already exists.', 409); }
            $queue = [[$source, 1]]; $ordered = []; $height = 1;
            while ($queue) {
                [$node, $depth] = array_shift($queue);
                if (isset($ordered[$node['id']]) || count($ordered) >= self::MAX_DELETE) { throw new MediaException('Subtree exceeds copy limit.', 409); }
                $ordered[$node['id']] = $node; $height = max($height, $depth);
                $children = $this->store->children($owner, $node['id'], '', self::MAX_DELETE + 1);
                if (count($ordered) + count($queue) + count($children) > self::MAX_DELETE) { throw new MediaException('Subtree exceeds copy limit.', 409); }
                foreach ($children as $child) { $queue[] = [$child, $depth + 1]; }
            }
            if (isset($ordered[$parent])) { throw new MediaException('Cannot copy into the source subtree.', 409); }
            $this->checkDepth($owner, $parent, $height); $mapping = []; $result = null;
            foreach ($ordered as $oldId => $node) {
                $binding = null;
                if ($node['node_type'] === 'media') {
                    $old = $this->store->binding($owner, $oldId);
                    if (!$old) { throw new MediaException('Missing binding. Rebind before copying.', 409); }
                    $binding = $this->storage->inspect($owner, (int)$old['nextcloud_file_id'], $old);
                }
                $mapping[$oldId] = bin2hex(random_bytes(16));
                $node['id'] = $mapping[$oldId]; $node['parent_id'] = $oldId === $id ? $parent : $mapping[$node['parent_id']];
                if ($oldId === $id) { $node['name'] = $name; $node['name_key'] = hash('sha256', $name); }
                $node['created_at'] = $node['updated_at'] = time(); $node['lock_version'] = 0;
                $this->store->insert($node);
                if ($binding) { $this->store->putBinding($owner, $node['id'], $binding + ['created_at' => time()]); }
                $result ??= $node;
            }
            return $result;
        });
    }
    public function rebind(string $owner, string $id, int $fileId): array {
        return $this->mutate($owner, function () use ($owner, $id, $fileId) {
            $node = $this->store->get($owner, $id);
            if ($node['node_type'] !== 'media') { throw new MediaException('Only media nodes may be rebound.', 409); }
            $binding = $this->storage->inspect($owner, $fileId);
            $old = $this->store->binding($owner, $id);
            $this->store->putBinding($owner, $id, $binding + ['created_at' => (int)($old['created_at'] ?? time())]);
            $this->store->update($owner, $id, ['updated_at' => time()]);
            return $this->show($owner, $id);
        });
    }
}
