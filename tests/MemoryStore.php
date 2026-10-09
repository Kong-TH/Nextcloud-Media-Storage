<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Exception\MediaException;
final class MemoryStore extends NodeStore {
    public array $rows = [];
    public array $bindings = [];
    public function __construct() {}
    public function get(string $owner, string $id): array {
        $row = $this->rows[$id] ?? null;
        if (!$row || $row['owner_id'] !== $owner) throw new MediaException('Node not found.', 404);
        return $row;
    }
    public function insert(array $row): void {
        foreach ($this->rows as $other) {
            if ($other['id'] === $row['id'] || ($other['parent_id'] === $row['parent_id'] && $other['name_key'] === $row['name_key'])) {
                throw new LogicException('Unique constraint violation');
            }
        }
        $this->rows[$row['id']] = $row;
    }
    public function update(string $owner, string $id, array $values): void {
        $this->rows[$id] = array_replace($this->get($owner, $id), $values);
    }
    public function children(string $owner, ?string $parent, string $search = '', int $limit = 100, int $offset = 0): array {
        $rows = array_values(array_filter($this->rows, fn($r) => $r['owner_id'] === $owner && !in_array($r['node_type'], ['root', 'bucket'], true)
            && ($parent === null || $r['parent_id'] === $parent) && ($search === '' || str_contains($r['name'], $search))));
        usort($rows, fn($a, $b) => [$a['name_key'], $a['id']] <=> [$b['name_key'], $b['id']]);
        return array_slice($rows, $offset, $limit);
    }
    public function sibling(string $owner, string $parent, string $name): ?array {
        foreach ($this->children($owner, $parent, '', PHP_INT_MAX) as $row) { if ($row['name_key'] === hash('sha256', $name)) return $row; }
        return null;
    }
    public function binding(string $owner, string $id): ?array { $this->get($owner, $id); return $this->bindings[$id] ?? null; }
    public function putBinding(string $owner, string $id, array $binding): void { $this->get($owner, $id); $this->bindings[$id] = $binding; }
    public function remove(string $owner, string $id): void { $this->get($owner, $id); unset($this->rows[$id], $this->bindings[$id]); }
    public function transaction(string $owner, string $root, callable $operation): mixed {
        $this->get($owner, $root); $snapshot = [$this->rows, $this->bindings];
        try { return $operation(); } catch (Throwable $e) { [$this->rows, $this->bindings] = $snapshot; throw $e; }
    }
}
