<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/MemoryStore.php';
use OCA\MediaStorage\Exception\MediaException;
use OCA\MediaStorage\Service\NodeRules;
use OCA\MediaStorage\Service\MediaStorageService;
use OCA\MediaStorage\Service\VirtualFileSystemService;
use OCP\Files\IRootFolder;
use OCP\Files\Folder;
use OCP\Files\File;
use OCP\Files\Storage\IStorage;
$passed = 0;
function check(bool $condition, string $label): void {
    global $passed;
    if (!$condition) throw new RuntimeException('FAIL: ' . $label);
    ++$passed;
}
function denied(callable $operation, int $status, string $label): void {
    try { $operation(); } catch (MediaException $e) { check($e->status === $status, $label); return; }
    throw new RuntimeException('FAIL: expected rejection: ' . $label);
}
foreach (['', '.', '..', 'a/b', 'a\\b', "bad\0", "bad\n", ' leading', 'trailing ', str_repeat('x', 256), "\xff"] as $bad) {
    denied(fn() => NodeRules::name($bad), 400, 'Invalid name rejected');
}
check(NodeRules::name('ภาพ.png') === 'ภาพ.png', 'UTF-8 names supported');
check(NodeRules::segments('/') === [], 'Root resolution segments');
denied(fn() => NodeRules::segments('a//b'), 400, 'Empty path segment rejected');
denied(fn() => NodeRules::segments('a/../b'), 400, 'Traversal path rejected');
denied(fn() => NodeRules::mediaType('image/svg+xml'), 415, 'Active SVG excluded');
denied(fn() => NodeRules::mediaType('text/html'), 415, 'HTML excluded');
$files = [];
$storageId = 'home::alice';
$physical = double(IStorage::class, ['getId' => function () use (&$storageId) { return $storageId; }]);
$readable = true; $mime = 'image/png';
$file = double(File::class, [
    'isReadable' => function () use (&$readable) { return $readable; },
    'getStorage' => fn() => $physical,
    'getMimeType' => function () use (&$mime) { return $mime; },
    'getPath' => fn() => '/alice/files/image.png', 'getSize' => fn() => 10,
]);
$files[1] = [$file];
$home = double(Folder::class, [
    'getById' => function ($id) use (&$files) { return $files[$id] ?? []; },
    'getRelativePath' => fn($path) => substr($path, strlen('/alice/files/')),
]);
$root = double(IRootFolder::class, ['getUserFolder' => function ($owner) use ($home) {
    if ($owner !== 'alice') throw new OCP\Files\NotFoundException();
    return $home;
}]);
$store = new MemoryStore(); $storage = new MediaStorageService($root); $vfs = new VirtualFileSystemService($store, $storage);
$a = $vfs->root('alice'); $b = $vfs->root('bob');
check($a['id'] !== $b['id'], 'Owners have distinct roots and root uniqueness keys');
check($a === $vfs->root('alice'), 'Root identity stable');
$folder = $vfs->create('alice', 'friends'); $child = $vfs->create('alice', 'friend-A', $folder['id']);
check($vfs->resolve('alice', '/friends/friend-A')['id'] === $child['id'], 'Nested path resolves');
check($vfs->show('alice', $child['id'])['virtual_path'] === '/friends/friend-A', 'Path derived from hierarchy');
denied(fn() => $vfs->create('alice', 'friends'), 409, 'Duplicate sibling');
check($vfs->create('bob', 'friends')['owner_id'] === 'bob', 'Same name allowed for another owner');
denied(fn() => $vfs->create('bob', 'bad', $folder['id']), 404, 'Cross-owner parent denied');
denied(fn() => $vfs->show('bob', $folder['id']), 404, 'Cross-owner read denied');
denied(fn() => $vfs->update('bob', $folder['id'], 'stolen', null), 404, 'Cross-owner rename denied');
denied(fn() => $vfs->destroy('bob', $folder['id']), 404, 'Cross-owner deletion denied');
denied(fn() => $vfs->update('alice', $folder['id'], null, $child['id']), 409, 'Move into descendant denied');
denied(fn() => $vfs->update('alice', $folder['id'], null, $folder['id']), 409, 'Self-parent denied');
$vfs->update('alice', $child['id'], 'renamed', $a['id']);
check($vfs->resolve('alice', '/renamed')['id'] === $child['id'], 'Move and rename retain identity');
denied(fn() => $vfs->resolve('alice', '/friends/friend-A'), 404, 'Old path no longer resolves');
check(count($vfs->listing('alice', null, 'renamed')['nodes']) === 1, 'Owner-scoped search');
denied(fn() => $vfs->listing('alice', null, '', 101), 400, 'Unbounded page rejected');
denied(fn() => $vfs->destroy('alice', $a['id']), 403, 'Root deletion denied');
denied(fn() => $vfs->update('alice', $a['id'], 'root', null), 403, 'Root rename denied');
$media = $vfs->create('alice', 'image.png', $folder['id'], 1);
check($vfs->show('alice', $media['id'])['binding_status'] === 'available', 'Accessible binding resolved');
$second = $vfs->create('alice', 'second.png', null, 1);
check($store->binding('alice', $second['id'])['nextcloud_file_id'] === 1, 'Multiple references to same file');
denied(fn() => $vfs->create('alice', 'under-file', $media['id']), 409, 'Media cannot be parent');
$readable = false;
check($vfs->show('alice', $media['id'])['binding_status'] === 'needs_rebind', 'Permission revoked binding fails closed');
denied(fn() => $vfs->create('alice', 'unreadable.png', null, 1), 404, 'Unreadable binding denied');
$readable = true; $files[1] = [];
check($vfs->show('alice', $media['id'])['binding_status'] === 'needs_rebind', 'Deleted file marked for recovery');
$files[1] = [$file, $file];
denied(fn() => $vfs->rebind('alice', $media['id'], 1), 409, 'Ambiguous mounted file rejected');
$files[1] = [$file]; $storageId = 'new-storage';
check($vfs->show('alice', $media['id'])['binding_status'] === 'needs_rebind', 'Changed storage context fails closed');
check($vfs->rebind('alice', $media['id'], 1)['binding_status'] === 'available', 'Explicit rebind recovers context');
$mime = 'text/html';
denied(fn() => $vfs->create('alice', 'bad.html', null, 1), 415, 'Unsupported media rejected');
$mime = 'image/png';
denied(fn() => $vfs->create('bob', 'stolen.png', null, 1), 404, 'Cross-owner filesystem access denied');
check($vfs->listing('alice', null, 'bad.html')['nodes'] === [], 'Failed bind leaves no virtual node');
$vfs->rebind('alice', $second['id'], 1);
$vfs->destroy('alice', $folder['id']);
denied(fn() => $vfs->show('alice', $media['id']), 404, 'Subtree deletion removes reference');
check(count($files[1]) === 1, 'Reference deletion preserves physical file');
check($vfs->show('alice', $second['id'])['binding_status'] === 'available', 'Other reference survives');
// Strict file/storage doubles have no delete/move/rename handler: physical mutation would fail the suite.
$deepParent = $a['id'];
for ($i = 0; $i < 127; ++$i) { $deepParent = $vfs->create('alice', 'depth-' . $i, $deepParent)['id']; }
denied(fn() => $vfs->create('alice', 'too-deep', $deepParent), 409, 'Depth bound enforced');
$subtree = $vfs->create('alice', 'subtree'); $vfs->create('alice', 'leaf', $subtree['id']);
denied(fn() => $vfs->update('alice', $subtree['id'], null, $deepParent), 409, 'Move checks descendant depth');
check($vfs->show('alice', $subtree['id'])['virtual_path'] === '/subtree', 'Failed move rolls back');
// Load controller/bootstrap classes against installed public declarations.
foreach ([OCA\MediaStorage\Controller\NodeController::class, OCA\MediaStorage\Controller\PageController::class, OCA\MediaStorage\AppInfo\Application::class, OCA\MediaStorage\Migration\Version000100Date20261009000000::class] as $class) {
    check(class_exists($class), 'Target interface load: ' . $class);
}
$session = double(OCP\IUserSession::class, ['getUser' => fn() => null]);
$request = double(OCP\IRequest::class, []);
$controller = new OCA\MediaStorage\Controller\NodeController($request, $session, $vfs);
check($controller->create('unauthenticated')->getStatus() === 401, 'Missing session denied');
$session->handlers['getUser'] = fn() => double(OCP\IUser::class, ['getUID' => fn() => 'bob']);
check($controller->update($second['id'], 'stolen')->getStatus() === 404, 'Controller derives owner from session');
foreach (['create', 'update', 'destroy', 'bind', 'rebind'] as $method) {
    $reflection = new ReflectionMethod($controller, $method);
    check($reflection->getAttributes(OCP\AppFramework\Http\Attribute\NoCSRFRequired::class) === [], 'Mutation retains CSRF: ' . $method);
    check($reflection->getAttributes(OCP\AppFramework\Http\Attribute\PublicPage::class) === [], 'Mutation retains authentication: ' . $method);
}
echo "PASS: $passed checks (service unit tests with strict public-interface doubles; no live database/instance).\n";
