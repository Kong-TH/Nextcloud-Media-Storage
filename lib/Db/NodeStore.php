<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Db;
use OCP\IDBConnection;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCA\MediaStorage\Exception\MediaException;

/** App-owned persistence. Every lookup includes the authenticated owner. */
class NodeStore {
    public function __construct(private IDBConnection $db) {}
    public function get(string $owner, string $id): array {
        $q = $this->db->getQueryBuilder();
        $q->select('*')->from('ms_nodes')->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('id', $q->createNamedParameter($id)));
        $r = $q->executeQuery(); $row = $r->fetchAssociative(); $r->closeCursor();
        if (!$row) { throw new MediaException('Node not found.', 404); }
        return $row;
    }
    public function insert(array $row): void {
        $q = $this->db->getQueryBuilder(); $q->insert('ms_nodes');
        foreach ($row as $key => $value) { $q->setValue($key, $q->createNamedParameter($value, is_int($value) ? IQueryBuilder::PARAM_INT : IQueryBuilder::PARAM_STR)); }
        $q->executeStatement();
    }
    public function update(string $owner, string $id, array $values): void {
        $q = $this->db->getQueryBuilder(); $q->update('ms_nodes')
            ->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('id', $q->createNamedParameter($id)));
        foreach ($values as $key => $value) { $q->set($key, $q->createNamedParameter($value, is_int($value) ? IQueryBuilder::PARAM_INT : IQueryBuilder::PARAM_STR)); }
        $q->executeStatement();
    }
    public function children(string $owner, ?string $parent, string $search = '', int $limit = 100, int $offset = 0): array {
        $q = $this->db->getQueryBuilder(); $q->select('*')->from('ms_nodes')
            ->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->neq('node_type', $q->createNamedParameter('root')));
        if ($parent !== null) { $q->andWhere($q->expr()->eq('parent_id', $q->createNamedParameter($parent))); }
        if ($search !== '') { $q->andWhere($q->expr()->like('name', $q->createNamedParameter('%' . $this->db->escapeLikeParameter($search) . '%'))); }
        $q->orderBy('name_key', 'ASC')->addOrderBy('id', 'ASC')->setMaxResults($limit)->setFirstResult($offset);
        $r = $q->executeQuery(); $rows = $r->fetchAllAssociative(); $r->closeCursor(); return $rows;
    }
    public function sibling(string $owner, string $parent, string $name): ?array {
        $q = $this->db->getQueryBuilder(); $q->select('*')->from('ms_nodes')
            ->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('parent_id', $q->createNamedParameter($parent)))
            ->andWhere($q->expr()->eq('name_key', $q->createNamedParameter(hash('sha256', $name))));
        $r = $q->executeQuery(); $row = $r->fetchAssociative(); $r->closeCursor(); return $row ?: null;
    }
    public function binding(string $owner, string $id): ?array {
        $q = $this->db->getQueryBuilder(); $q->select('*')->from('ms_bindings')
            ->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('virtual_node_id', $q->createNamedParameter($id)));
        $r = $q->executeQuery(); $row = $r->fetchAssociative(); $r->closeCursor(); return $row ?: null;
    }
    public function putBinding(string $owner, string $id, array $binding): void {
        $this->removeBinding($owner, $id);
        $q = $this->db->getQueryBuilder(); $q->insert('ms_bindings');
        foreach (['owner_id' => $owner, 'virtual_node_id' => $id] + $binding as $key => $value) {
            $q->setValue($key, $q->createNamedParameter($value, is_int($value) ? IQueryBuilder::PARAM_INT : IQueryBuilder::PARAM_STR));
        }
        $q->executeStatement();
    }
    private function removeBinding(string $owner, string $id): void {
        $q = $this->db->getQueryBuilder(); $q->delete('ms_bindings')->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('virtual_node_id', $q->createNamedParameter($id))); $q->executeStatement();
    }
    public function remove(string $owner, string $id): void {
        $this->removeBinding($owner, $id);
        $q = $this->db->getQueryBuilder(); $q->delete('ms_nodes')->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('id', $q->createNamedParameter($id))); $q->executeStatement();
    }
    /** A write to the owner's root serializes hierarchy mutations across processes. */
    public function transaction(string $owner, string $root, callable $operation): mixed {
        $this->db->beginTransaction();
        try {
            $q = $this->db->getQueryBuilder();
            $q->update('ms_nodes')->set('lock_version', $q->createFunction('lock_version + 1'))
                ->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
                ->andWhere($q->expr()->eq('id', $q->createNamedParameter($root)));
            if ($q->executeStatement() !== 1) { throw new MediaException('Owner root not found.', 409); }
            $result = $operation(); $this->db->commit(); return $result;
        } catch (\Throwable $e) { $this->db->rollBack(); throw $e; }
    }
}
