<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Migration;
use OCP\Migration\SimpleMigrationStep;
use OCP\Migration\IOutput;
use OCP\DB\ISchemaWrapper;
final class Version000100Date20261009000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();
        if (!$schema->hasTable('ms_nodes')) {
            $t = $schema->createTable('ms_nodes');
            foreach (['id' => 64, 'owner_id' => 64, 'parent_id' => 64, 'name' => 255, 'name_key' => 64, 'node_type' => 10] as $name => $length) {
                $t->addColumn($name, 'string', ['notnull' => true, 'length' => $length]);
            }
            foreach (['created_at', 'updated_at', 'lock_version'] as $name) { $t->addColumn($name, 'bigint', ['notnull' => true, 'default' => 0]); }
            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['parent_id', 'name_key'], 'ms_sibling_unique');
            $t->addIndex(['owner_id', 'parent_id'], 'ms_owner_parent');
        }
        if (!$schema->hasTable('ms_bindings')) {
            $t = $schema->createTable('ms_bindings');
            foreach (['virtual_node_id' => 64, 'owner_id' => 64, 'storage_reference' => 64, 'last_known_path' => 4000, 'mime_type' => 127] as $name => $length) {
                $t->addColumn($name, 'string', ['notnull' => true, 'length' => $length]);
            }
            foreach (['nextcloud_file_id', 'file_size', 'created_at', 'updated_at'] as $name) { $t->addColumn($name, 'bigint', ['notnull' => true]); }
            $t->setPrimaryKey(['virtual_node_id']); $t->addIndex(['owner_id', 'nextcloud_file_id'], 'ms_owner_file');
        }
        return $schema;
    }
}
