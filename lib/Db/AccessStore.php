<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Db;
use OCP\IDBConnection;
use OCP\DB\QueryBuilder\IQueryBuilder;
class AccessStore {
    public function __construct(private IDBConnection $db) {}
    public function find(string $id): ?array {
        $q = $this->db->getQueryBuilder();
        $q->select('*')->from('ms_access')->where($q->expr()->eq('id', $q->createNamedParameter($id)));
        $r = $q->executeQuery(); $row = $r->fetchAssociative(); $r->closeCursor(); return $row ?: null;
    }
    public function listing(string $owner, string $node, int $limit, int $offset): array {
        $q = $this->db->getQueryBuilder();
        $q->select('*')->from('ms_access')->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('node_id', $q->createNamedParameter($node)))
            ->orderBy('created_at', 'DESC')->addOrderBy('id', 'ASC')->setMaxResults($limit)->setFirstResult($offset);
        $r = $q->executeQuery(); $rows = $r->fetchAllAssociative(); $r->closeCursor(); return $rows;
    }
    public function insert(array $row): void {
        $q = $this->db->getQueryBuilder(); $q->insert('ms_access');
        foreach ($row as $key => $value) {
            $type = $value === null ? IQueryBuilder::PARAM_NULL : (is_int($value) ? IQueryBuilder::PARAM_INT : IQueryBuilder::PARAM_STR);
            $q->setValue($key, $q->createNamedParameter($value, $type));
        }
        $q->executeStatement();
    }
    public function revoke(string $owner, string $id, int $at): void {
        $q = $this->db->getQueryBuilder();
        $q->update('ms_access')->set('revoked_at', $q->createNamedParameter($at, IQueryBuilder::PARAM_INT))
            ->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('id', $q->createNamedParameter($id)))
            ->andWhere($q->expr()->isNull('revoked_at'))->executeStatement();
    }
}
