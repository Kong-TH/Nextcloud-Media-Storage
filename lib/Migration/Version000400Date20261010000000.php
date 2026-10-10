<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Migration;
use OCP\Migration\SimpleMigrationStep;
use OCP\Migration\IOutput;
use OCP\DB\ISchemaWrapper;
final class Version000400Date20261010000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();
        if (!$schema->hasTable('ms_uploads')) {
            $t = $schema->createTable('ms_uploads');
            foreach (['id' => 32, 'owner_id' => 64, 'fingerprint' => 64, 'physical_path' => 255, 'node_id' => 64, 'state' => 16] as $name => $length) {
                $t->addColumn($name, 'string', ['notnull' => true, 'length' => $length]);
            }
            $t->addColumn('created_at', 'bigint', ['notnull' => true]);
            $t->setPrimaryKey(['owner_id', 'id']);
        }
        return $schema;
    }
}
