<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Db;
use OCP\IDBConnection;
class UploadStore {
    public function __construct(private IDBConnection $db) {}
    public function find(string $owner, string $id): ?array {
        $q = $this->db->getQueryBuilder();
        $q->select('*')->from('ms_uploads')->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('id', $q->createNamedParameter($id)));
        $r = $q->executeQuery(); $row = $r->fetchAssociative(); $r->closeCursor(); return $row ?: null;
    }
    public function insert(array $row): void {
        $q = $this->db->getQueryBuilder(); $q->insert('ms_uploads');
        foreach ($row as $key => $value) { $q->setValue($key, $q->createNamedParameter($value)); }
        $q->executeStatement();
    }
    public function complete(string $owner, string $id, string $node): void {
        $q = $this->db->getQueryBuilder(); $q->update('ms_uploads')->set('state', $q->createNamedParameter('complete'))
            ->set('node_id', $q->createNamedParameter($node))
            ->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
            ->andWhere($q->expr()->eq('id', $q->createNamedParameter($id)))->executeStatement();
    }
}
