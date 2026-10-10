<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Db;
use OCP\IDBConnection;
class BucketStore {
    public function __construct(private IDBConnection $db) {}
    public function listing(string $owner, int $limit, int $offset): array {
        $q = $this->db->getQueryBuilder();
        $q->select('id', 'name')->from('ms_buckets')->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->orderBy('created_at', 'ASC')->addOrderBy('id', 'ASC')->setMaxResults($limit)->setFirstResult($offset);
        $r = $q->executeQuery(); $rows = $r->fetchAllAssociative(); $r->closeCursor(); return $rows;
    }
    public function exists(string $owner, string $name): bool {
        $q = $this->db->getQueryBuilder();
        $q->select('id')->from('ms_buckets')->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('name_key', $q->createNamedParameter(hash('sha256', $name))));
        $r = $q->executeQuery(); $found = $r->fetchOne() !== false; $r->closeCursor(); return $found;
    }
    public function insert(array $row): void {
        $q = $this->db->getQueryBuilder(); $q->insert('ms_buckets');
        foreach ($row as $key => $value) { $q->setValue($key, $q->createNamedParameter($value)); }
        $q->executeStatement();
    }
    public function rename(string $owner, string $id, string $name): void {
        $q = $this->db->getQueryBuilder();
        $q->update('ms_buckets')->set('name', $q->createNamedParameter($name))
            ->set('name_key', $q->createNamedParameter(hash('sha256', $name)))
            ->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('id', $q->createNamedParameter($id)));
        $q->executeStatement();
    }
    public function remove(string $owner, string $id): void {
        $q = $this->db->getQueryBuilder();
        $q->delete('ms_buckets')->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('id', $q->createNamedParameter($id)));
        $q->executeStatement();
    }

}
