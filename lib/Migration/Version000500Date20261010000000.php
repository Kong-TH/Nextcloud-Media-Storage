<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Migration;
use OCP\Migration\SimpleMigrationStep;
use OCP\Migration\IOutput;
use OCP\DB\ISchemaWrapper;
final class Version000500Date20261010000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();
        if (!$schema->hasTable('ms_access')) {
            $t = $schema->createTable('ms_access');
            foreach (['id' => 32, 'owner_id' => 64, 'node_id' => 64, 'bucket_id' => 64, 'secret_hash' => 64,
                'storage_reference' => 64, 'file_etag' => 255] as $name => $length) {
                $t->addColumn($name, 'string', ['notnull' => true, 'length' => $length]);
            }
            $t->addColumn('issuer_id', 'string', ['notnull' => false, 'length' => 32]);
            foreach (['file_id', 'created_at', 'expires_at'] as $name) { $t->addColumn($name, 'bigint', ['notnull' => true]); }
            $t->addColumn('revoked_at', 'bigint', ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['owner_id', 'node_id'], 'ms_access_owner_node');
        }
        return $schema;
    }
}
