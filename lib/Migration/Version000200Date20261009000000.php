<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Migration;
use OCP\Migration\SimpleMigrationStep;
use OCP\Migration\IOutput;
use OCP\DB\ISchemaWrapper;
final class Version000200Date20261009000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();
        if (!$schema->hasTable('ms_tokens')) {
            $t = $schema->createTable('ms_tokens');
            foreach (['id' => 32, 'owner_id' => 64, 'name' => 100, 'token_hash' => 64, 'scopes' => 255] as $name => $length) {
                $t->addColumn($name, 'string', ['notnull' => true, 'length' => $length]);
            }
            $t->addColumn('folder_id', 'string', ['notnull' => false, 'length' => 64]);
            foreach (['expires_at', 'created_at'] as $name) { $t->addColumn($name, 'bigint', ['notnull' => true]); }
            foreach (['revoked_at', 'last_used_at'] as $name) { $t->addColumn($name, 'bigint', ['notnull' => false]); }
            $t->setPrimaryKey(['id']); $t->addIndex(['owner_id', 'created_at'], 'ms_tokens_owner');
        }
        return $schema;
    }
}
