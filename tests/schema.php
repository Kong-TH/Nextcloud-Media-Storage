<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
use Doctrine\DBAL\Schema\Schema;
use Doctrine\DBAL\Platforms\SqlitePlatform;
use OCA\MediaStorage\Migration\Version000100Date20261009000000;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
$schema = new Schema();
$wrapper = double(ISchemaWrapper::class, [
    'hasTable' => fn($name) => $schema->hasTable('test_' . $name),
    'createTable' => fn($name) => $schema->createTable('test_' . $name),
]);
$output = double(IOutput::class, []);
$migration = new Version000100Date20261009000000();
$migration->changeSchema($output, fn() => $wrapper, []);
if (count($schema->getTables()) !== 2) throw new RuntimeException('Expected two app-owned tables');
$migration->changeSchema($output, fn() => $wrapper, []);
if (count($schema->getTables()) !== 2) throw new RuntimeException('Migration is not idempotent');
$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
foreach ($schema->toSql(new SqlitePlatform()) as $sql) $pdo->exec($sql);
$insert = $pdo->prepare('INSERT INTO test_ms_nodes (id, owner_id, parent_id, name, name_key, node_type) VALUES (?, ?, ?, ?, ?, ?)');
$insert->execute(['root-a', 'alice', '', '', hash('sha256', 'alice'), 'root']);
$insert->execute(['root-b', 'bob', '', '', hash('sha256', 'bob'), 'root']);
$insert->execute(['a1', 'alice', 'root-a', 'same', hash('sha256', 'same'), 'folder']);
$insert->execute(['b1', 'bob', 'root-b', 'same', hash('sha256', 'same'), 'folder']);
try {
    $insert->execute(['a2', 'alice', 'root-a', 'same', hash('sha256', 'same'), 'folder']);
    throw new RuntimeException('Sibling duplicate accepted');
} catch (PDOException $e) { if ($e->getCode() !== '23000') throw $e; }
$insert->execute(['a3', 'alice', 'root-a', 'Same', hash('sha256', 'Same'), 'folder']);
$pdo->beginTransaction();
$pdo->exec("UPDATE test_ms_nodes SET lock_version = lock_version + 1 WHERE id = 'root-a'");
$pdo->exec("DELETE FROM test_ms_nodes WHERE id = 'a1'");
$pdo->rollBack();
if ((int)$pdo->query("SELECT count(*) FROM test_ms_nodes WHERE id = 'a1'")->fetchColumn() !== 1) throw new RuntimeException('Rollback failed');
if ((int)$pdo->query("SELECT lock_version FROM test_ms_nodes WHERE id = 'root-a'")->fetchColumn() !== 0) throw new RuntimeException('Lock rollback failed');
// Execute the incremental token migration over the populated Phase 1 SQLite schema.
$before = clone $schema;
$upgrade = new OCA\MediaStorage\Migration\Version000200Date20261009000000();
$upgrade->changeSchema($output, fn() => $wrapper, []);
$platform = new SqlitePlatform();
$diff = (new Doctrine\DBAL\Schema\Comparator($platform))->compareSchemas($before, $schema);
foreach ($platform->getAlterSchemaSQL($diff) as $sql) $pdo->exec($sql);
if ((int)$pdo->query('SELECT count(*) FROM test_ms_nodes')->fetchColumn() !== 5) throw new RuntimeException('Upgrade changed existing nodes');
$upgrade->changeSchema($output, fn() => $wrapper, []);
if (count($schema->getTables()) !== 3) throw new RuntimeException('Token migration re-entry failed');
$tokenInsert = $pdo->prepare('INSERT INTO test_ms_tokens (id, owner_id, name, token_hash, scopes, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
$tokenInsert->execute([str_repeat('a', 32), 'alice', 'Test fixture', str_repeat('b', 64), '["media:read"]', time() + 60, time()]);
if ($pdo->query('SELECT revoked_at FROM test_ms_tokens')->fetchColumn() !== null) throw new RuntimeException('New token is not unrevoked');
// SQL compilation is distinct from provider execution/support.
foreach ([new Doctrine\DBAL\Platforms\MySQL80Platform(), new Doctrine\DBAL\Platforms\PostgreSQLPlatform()] as $platform) {
    if (!$schema->toSql($platform)) throw new RuntimeException('Empty schema SQL');
}
// Validate template structure in memory only; this does not choose project identity/licence.
$metadata = new DOMDocument();
$metadata->load(dirname(__DIR__) . '/appinfo/info.xml.in');
$metadata->getElementsByTagName('author')->item(0)->textContent = 'Test fixture';
$metadata->getElementsByTagName('licence')->item(0)->textContent = 'AGPL-3.0-or-later';
$source = getenv('NEXTCLOUD_SOURCE') ?: '/snap/nextcloud/current/htdocs';
if (!$metadata->schemaValidate($source . '/resources/app-info.xsd')) throw new RuntimeException('App metadata template invalid');
echo "PASS: migration schema creation/re-entry, SQLite installation and populated 0.1-to-0.2 schema upgrade, root isolation, sibling constraints, case-sensitive keys and rollback; MySQL/PostgreSQL SQL generation only; app metadata template schema valid.\n";
