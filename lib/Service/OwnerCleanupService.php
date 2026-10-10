<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCP\IDBConnection;
class OwnerCleanupService {
    public function __construct(private IDBConnection $db) {}
    public function purge(string $owner): void {
        $this->db->beginTransaction();
        try {
            $q = $this->db->getQueryBuilder();
            $q->update('ms_nodes')->set('lock_version', $q->createFunction('lock_version + 1'))
                ->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))
                ->andWhere($q->expr()->eq('node_type', $q->createNamedParameter('root')))->executeStatement();
            foreach (['ms_access', 'ms_uploads', 'ms_tokens', 'ms_buckets', 'ms_bindings', 'ms_nodes'] as $table) {
                $q = $this->db->getQueryBuilder();
                $q->delete($table)->where($q->expr()->eq('owner_id', $q->createNamedParameter($owner)))->executeStatement();
            }
            $this->db->commit();
        } catch (\Throwable $error) { $this->db->rollBack(); throw $error; }
    }
}
