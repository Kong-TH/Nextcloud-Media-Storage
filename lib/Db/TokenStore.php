<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Db;
use OCP\IDBConnection;
use OCP\DB\QueryBuilder\IQueryBuilder;
class TokenStore {
    public function __construct(private IDBConnection $db) {}
    public function find(string $id): ?array {
        $q = $this->db->getQueryBuilder();
        $q->select('*')->from('ms_tokens')->where($q->expr()->eq('id', $q->createNamedParameter($id)));
        $r = $q->executeQuery(); $row = $r->fetchAssociative(); $r->closeCursor(); return $row ?: null;
    }
    public function listing(string $owner, int $limit = 100, int $offset = 0): array {
        $q = $this->db->getQueryBuilder();
        $q->select('*')->from('ms_tokens')->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->orderBy('created_at', 'DESC')->addOrderBy('id', 'ASC')->setMaxResults($limit)->setFirstResult($offset);
        $r = $q->executeQuery(); $rows = $r->fetchAllAssociative(); $r->closeCursor(); return $rows;
    }
    public function insert(array $row): void {
        $q = $this->db->getQueryBuilder(); $q->insert('ms_tokens');
        foreach ($row as $key => $value) {
            $type = $value === null ? IQueryBuilder::PARAM_NULL : (is_int($value) ? IQueryBuilder::PARAM_INT : IQueryBuilder::PARAM_STR);
            $q->setValue($key, $q->createNamedParameter($value, $type));
        }
        $q->executeStatement();
    }
    public function update(string $owner, string $id, array $values): void {
        $q = $this->db->getQueryBuilder(); $q->update('ms_tokens')
            ->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('id', $q->createNamedParameter($id)));
        foreach ($values as $key => $value) { $q->set($key, $q->createNamedParameter($value, IQueryBuilder::PARAM_INT)); }
        $q->executeStatement();
    }
}
