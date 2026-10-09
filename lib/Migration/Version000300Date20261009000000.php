<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Migration;
use OCP\Migration\SimpleMigrationStep;
use OCP\Migration\IOutput;
use OCP\DB\ISchemaWrapper;
final class Version000300Date20261009000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();
        if (!$schema->hasTable('ms_buckets')) {
            $t = $schema->createTable('ms_buckets');
            foreach (['id' => 64, 'owner_id' => 64, 'name' => 255, 'name_key' => 64] as $name => $length) {
                $t->addColumn($name, 'string', ['notnull' => true, 'length' => $length]);
            }
            $t->addColumn('created_at', 'bigint', ['notnull' => true]);
            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['owner_id', 'name_key'], 'ms_bucket_name');
        }
        return $schema;
    }
}
