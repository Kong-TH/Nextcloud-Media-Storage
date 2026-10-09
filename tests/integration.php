<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
/** Run only on a disposable initialized Nextcloud with this app enabled. */
if (getenv('MEDIASTORAGE_TEST_DISPOSABLE') !== 'yes') {
    fwrite(STDERR, "Refusing integration test: set MEDIASTORAGE_TEST_DISPOSABLE=yes for a disposable instance.\n"); exit(2);
}
$source = getenv('NEXTCLOUD_SOURCE'); $owner = getenv('MEDIASTORAGE_TEST_USER');
if (!$source || !$owner) { fwrite(STDERR, "Set NEXTCLOUD_SOURCE and MEDIASTORAGE_TEST_USER (existing dedicated test user).\n"); exit(2); }
define('OC_CONSOLE', 1);
require $source . '/lib/base.php';
$loader = require $source . '/3rdparty/autoload.php';
$loader->setClassMapAuthoritative(false);
$loader->addPsr4('OCA\\MediaStorage\\', dirname(__DIR__) . '/lib/');
use OCP\Server;
use OCP\IDBConnection;
use OCP\Files\IRootFolder;
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Service\MediaStorageService;
use OCA\MediaStorage\Service\VirtualFileSystemService;
use OCA\MediaStorage\Exception\MediaException;
$db = Server::get(IDBConnection::class);
$roots = Server::get(IRootFolder::class);
$user = Server::get(OCP\IUserManager::class)->get($owner);
if (!$user) throw new RuntimeException('Dedicated test user does not exist');
Server::get(OCP\IUserSession::class)->setUser($user);
$store = new NodeStore($db); $vfs = new VirtualFileSystemService($store, new MediaStorageService($roots));
$fixture = null; $virtual = null;
try {
    $fixture = $roots->getUserFolder($owner)->newFolder('mediastorage-test-' . bin2hex(random_bytes(6)));
    $file = $fixture->newFile('pixel.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1cAAAAASUVORK5CYII='));
    $virtual = $vfs->create($owner, 'test-' . bin2hex(random_bytes(6)));
    $nested = $vfs->create($owner, 'nested', $virtual['id']);
    $media = $vfs->create($owner, 'pixel.png', $nested['id'], (int)$file->getId());
    if ($vfs->show($owner, $media['id'])['binding_status'] !== 'available') throw new RuntimeException('Binding failed');
    if ($vfs->resolve($owner, '/' . $virtual['name'] . '/nested/pixel.png')['id'] !== $media['id']) throw new RuntimeException('Resolution failed');
    try { $vfs->create($owner, 'nested', $virtual['id']); throw new RuntimeException('Duplicate accepted'); }
    catch (MediaException $e) { if ($e->status !== 409) throw $e; }
    try { $vfs->update($owner, $virtual['id'], null, $nested['id']); throw new RuntimeException('Cycle accepted'); }
    catch (MediaException $e) { if ($e->status !== 409) throw $e; }
    $replacement = $fixture->newFile('replacement.png', $file->getContent());
    $file->delete(); // Test fixture deletion, never application reference deletion.
    if ($vfs->show($owner, $media['id'])['binding_status'] !== 'needs_rebind') throw new RuntimeException('Missing file not detected');
    $vfs->rebind($owner, $media['id'], (int)$replacement->getId());
    $vfs->destroy($owner, $virtual['id']); $virtual = null;
    if (!$fixture->nodeExists('replacement.png')) throw new RuntimeException('Virtual deletion removed physical file');
    echo "PASS: live database and Filesystem API create/bind/resolve/duplicate/cycle/missing/rebind/reference deletion.\n";
} finally {
    if ($virtual) $vfs->destroy($owner, $virtual['id']);
    if ($fixture) $fixture->delete(); // Clean up only the uniquely named test fixture.
}
