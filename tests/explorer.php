<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
require __DIR__ . '/run.php';
use OCA\MediaStorage\Db\BucketStore;
use OCA\MediaStorage\Service\BucketService;
use OCA\MediaStorage\Service\MediaStorageService;
use OCA\MediaStorage\Service\VirtualFileSystemService;
final class MemoryBuckets extends BucketStore {
    public array $rows = [];
    public bool $failRemoval = false;
    public function __construct() {}
    public function listing(string $owner, int $limit, int $offset): array { return array_slice(array_values(array_filter($this->rows, fn($r) => $r['owner_id'] === $owner)), $offset, $limit); }
    public function exists(string $owner, string $name): bool { return (bool)array_filter($this->rows, fn($r) => $r['owner_id'] === $owner && $r['name'] === $name); }
    public function insert(array $row): void { $this->rows[$row['id']] = $row; }
    public function rename(string $owner, string $id, string $name): void { if ($this->failRemoval) throw new RuntimeException('Injected bucket persistence failure'); $this->rows[$id]['name'] = $name; $this->rows[$id]['name_key'] = hash('sha256', $name); }
    public function remove(string $owner, string $id): void { if ($this->failRemoval) throw new RuntimeException('Injected bucket persistence failure'); if (($this->rows[$id]['owner_id'] ?? null) !== $owner) throw new RuntimeException('Owner mismatch'); unset($this->rows[$id]); }
}
$beforeChecks = $passed;
$store = new MemoryStore(); $bucketStore = new MemoryBuckets();
$readable = true; $mime = 'image/png'; $storageId = 'home::alice'; $files[1] = [$file];
$vfs = new VirtualFileSystemService($store, new MediaStorageService($root));
$buckets = new BucketService($bucketStore, $store, $vfs);
$existing = $vfs->create('alice', 'Existing');
$default = $buckets->listing('alice')['buckets'][0];
check($default['id'] === $vfs->root('alice')['id'] && $default['name'] === 'Library', 'Default bucket preserves owner root');
check($vfs->show('alice', $existing['id'])['virtual_path'] === '/Existing', 'Default bucket preserves existing virtual paths');
$brand = $buckets->create('alice', 'Brand'); $other = $buckets->create('bob', 'Brand');
check($brand['id'] !== $other['id'], 'Identical bucket names isolated by owner');
check(count($buckets->listing('alice')['buckets']) === 2, 'Bucket list owner isolated');
denied(fn() => $buckets->create('alice', 'Brand'), 409, 'Duplicate bucket rejected');
denied(fn() => $buckets->create('alice', 'Library'), 409, 'Default bucket name reserved');
denied(fn() => $buckets->create('alice', '../bad'), 400, 'Invalid bucket name rejected');
denied(fn() => $vfs->create('bob', 'bad', $brand['id']), 404, 'Cross-owner bucket parent rejected');
denied(fn() => $vfs->destroy('alice', $brand['id']), 403, 'Bucket root cannot be deleted as a node');
denied(fn() => $vfs->update('alice', $brand['id'], 'Changed', null), 403, 'Bucket root cannot be renamed as a node');
$folder = $vfs->create('alice', 'Images', $brand['id']);
$link = $vfs->create('alice', 'Original.png', $folder['id'], 1);
check($vfs->show('alice', $link['id'])['virtual_path'] === '/Images/Original.png', 'Paths are bucket relative');
$copy = $vfs->copy('alice', $folder['id'], $default['id']);
check($copy['id'] !== $folder['id'], 'Copy creates new folder identity');
$child = $vfs->listing('alice', $copy['id'])['nodes'][0];
check($child['id'] !== $link['id'] && $store->binding('alice', $child['id'])['nextcloud_file_id'] === 1, 'Copy creates independent reference to same physical file');
$vfs->update('alice', $child['id'], 'Alias.png', null);
check($store->get('alice', $link['id'])['name'] === 'Original.png', 'Alias rename leaves source name unchanged');
denied(fn() => $vfs->copy('bob', $link['id'], $other['id']), 404, 'Copy source owner boundary');
denied(fn() => $vfs->copy('alice', $link['id'], $other['id']), 404, 'Copy destination owner boundary');
denied(fn() => $vfs->copy('alice', $brand['id'], $default['id']), 403, 'Copy bucket root forbidden');
denied(fn() => $vfs->copy('alice', $folder['id'], $folder['id']), 409, 'Copy into source subtree forbidden');
denied(fn() => $vfs->copy('alice', $folder['id'], $default['id']), 409, 'Copy duplicate rejected');
$snapshot = $store->rows; $readable = false;
denied(fn() => $vfs->copy('alice', $folder['id'], $default['id'], 'Broken copy'), 404, 'Copy revalidates binding');
check($store->rows === $snapshot, 'Failed copy rolls back every inserted node'); $readable = true;
$vfs->destroy('alice', $copy['id']);
check($vfs->show('alice', $link['id'])['binding_status'] === 'available', 'Removing copied tree preserves source file and reference');
$global = $vfs->listing('alice', null, 'Brand')['nodes'];
check(!$global, 'Bucket roots excluded from ordinary global search');
denied(fn() => $buckets->destroy('alice', $default['id']), 403, 'Default Library protected by bucket route');
denied(fn() => $buckets->destroy('bob', $brand['id']), 404, 'Bucket removal owner isolation');
denied(fn() => $buckets->destroy('alice', $folder['id']), 404, 'Ordinary folder cannot masquerade as bucket');
$elsewhere = $vfs->create('alice', 'Elsewhere.png', $default['id'], 1);
$snapshot = [$store->rows, $store->bindings, $bucketStore->rows]; $bucketStore->failRemoval = true;
try { $buckets->destroy('alice', $brand['id']); throw new RuntimeException('Expected injected failure'); }
catch (RuntimeException $e) { check($e->getMessage() === 'Injected bucket persistence failure', 'Failure injected after node removal'); }
check([$store->rows, $store->bindings, $bucketStore->rows] === $snapshot, 'Bucket persistence failure rolls back removed metadata');
$bucketStore->failRemoval = false; $buckets->destroy('alice', $brand['id']);
check(!isset($bucketStore->rows[$brand['id']]) && !isset($store->rows[$brand['id']]) && !isset($store->rows[$folder['id']]) && !isset($store->rows[$link['id']]) && !isset($store->bindings[$link['id']]), 'Populated bucket and nested bindings removed');
check($vfs->show('alice', $elsewhere['id'])['binding_status'] === 'available', 'Bucket removal preserves original and links elsewhere');
check(isset($bucketStore->rows[$other['id']]), 'Other owner bucket preserved');
denied(fn() => $buckets->destroy('alice', $brand['id']), 404, 'Repeated removal is missing');
check($buckets->create('alice', 'Brand')['id'] !== $brand['id'], 'Removed name can be reused with a fresh boundary identity');
$large = $buckets->create('alice', 'Large');
for ($i = 0; $i < 1000; ++$i) {
    $row = $store->rows[$large['id']];
    $row['id'] = str_pad('large-' . $i, 32, '0', STR_PAD_LEFT); $row['node_type'] = 'folder'; $row['parent_id'] = $large['id']; $row['name'] = 'Child ' . $i; $row['name_key'] = hash('sha256', $row['name']); $store->insert($row);
}
$snapshot = [$store->rows, $bucketStore->rows];
denied(fn() => $buckets->destroy('alice', $large['id']), 409, 'Oversized subtree rejected');
check([$store->rows, $bucketStore->rows] === $snapshot, 'Oversized subtree does not partially remove data');
$store->remove('alice', str_pad('large-0', 32, '0', STR_PAD_LEFT)); $buckets->destroy('alice', $large['id']);
check(!isset($bucketStore->rows[$large['id']]), 'Exactly 1000 nodes including bucket root can be removed');
$request = double(OCP\IRequest::class, []);
$session = double(OCP\IUserSession::class, ['getUser' => fn() => double(OCP\IUser::class, ['getUID' => fn() => 'alice'])]);
$controller = new OCA\MediaStorage\Controller\BucketController($request, $session, $buckets);
$empty = $buckets->create('alice', 'Empty');
check($controller->destroy($empty['id'])->getStatus() === 204, 'Session bucket removal returns 204');
$method = new ReflectionMethod($controller, 'destroy');
check(!$method->getAttributes(OCP\AppFramework\Http\Attribute\NoCSRFRequired::class) && !$method->getAttributes(OCP\AppFramework\Http\Attribute\PublicPage::class), 'Bucket removal retains session and CSRF middleware');
$editable = $buckets->create('alice', 'Editable');
$nested = $vfs->create('alice', 'Nested', $editable['id']);
$reference = $vfs->create('alice', 'Bound.png', $nested['id'], 1);
$changed = $buckets->rename('alice', $editable['id'], 'Renamed');
check($changed['id'] === $editable['id'] && $bucketStore->rows[$editable['id']]['name'] === 'Renamed' && $store->get('alice', $editable['id'])['name'] === 'Renamed', 'Rename updates both bucket records with stable ID');
check($vfs->show('alice', $reference['id'])['virtual_path'] === '/Nested/Bound.png', 'Rename preserves virtual path and binding identity');
check($buckets->rename('alice', $editable['id'], 'Renamed')['name'] === 'Renamed', 'No-op rename accepted');
denied(fn() => $buckets->rename('bob', $editable['id'], 'stolen'), 404, 'Cross-owner rename denied');
denied(fn() => $buckets->clear('bob', $editable['id']), 404, 'Cross-owner clear denied');
denied(fn() => $buckets->rename('alice', $nested['id'], 'bad'), 404, 'Rename rejects ordinary node IDs');
denied(fn() => $buckets->clear('alice', $nested['id']), 404, 'Clear rejects ordinary node IDs');
denied(fn() => $buckets->rename('alice', $editable['id'], 'Library'), 409, 'Library remains reserved');
denied(fn() => $buckets->rename('alice', $editable['id'], '../bad'), 400, 'Invalid rename denied');
$rootBefore = $store->get('alice', $default['id']);
$renamedDefault = $buckets->rename('alice', $default['id'], 'My media');
check($renamedDefault['is_default'] && $renamedDefault['id'] === $default['id'] && $store->get('alice', $default['id'])['name_key'] === $rootBefore['name_key'], 'Default display name changes while root identity/key remain stable');
check($buckets->listing('alice')['buckets'][0]['name'] === 'My media', 'Default display name persists in listing');
denied(fn() => $buckets->create('alice', 'My media'), 409, 'Creation cannot duplicate renamed default');
denied(fn() => $buckets->rename('alice', $editable['id'], 'My media'), 409, 'Rename cannot duplicate renamed default');
denied(fn() => $buckets->rename('alice', $default['id'], 'Renamed'), 409, 'Default rename cannot duplicate additional bucket');
denied(fn() => $buckets->destroy('alice', $default['id']), 403, 'Renamed default is still protected');
$snapshot = [$store->rows, $bucketStore->rows]; $bucketStore->failRemoval = true;
try { $buckets->rename('alice', $editable['id'], 'Failed rename'); throw new RuntimeException('Expected failure'); }
catch (RuntimeException $e) { check($e->getMessage() === 'Injected bucket persistence failure', 'Rename persistence failure injected'); }
check([$store->rows, $bucketStore->rows] === $snapshot, 'Rename failure rolls back node metadata'); $bucketStore->failRemoval = false;
$buckets->clear('alice', $default['id']);
check($buckets->listing('alice')['buckets'][0]['name'] === 'My media' && !$store->children('alice', $default['id']), 'Clear default preserves renamed root and empties descendants');
check($vfs->show('alice', $reference['id'])['binding_status'] === 'available', 'Clear default preserves other bucket and original binding');
$buckets->clear('alice', $editable['id']);
check(isset($bucketStore->rows[$editable['id']]) && !$store->children('alice', $editable['id']) && !isset($store->rows[$nested['id']]) && !isset($store->bindings[$reference['id']]), 'Clear additional bucket keeps bucket and removes nested metadata');
check($controller->clear($editable['id'])->getStatus() === 204, 'Clear is safely repeatable on empty bucket');
check($controller->rename($editable['id'], 'Controller rename')->getData()['name'] === 'Controller rename', 'Session rename returns updated metadata');
foreach (['rename', 'clear'] as $action) {
    $method = new ReflectionMethod($controller, $action);
    check(!$method->getAttributes(OCP\AppFramework\Http\Attribute\NoCSRFRequired::class) && !$method->getAttributes(OCP\AppFramework\Http\Attribute\PublicPage::class), 'Bucket management retains middleware: ' . $action);
}
echo 'PASS: ' . ($passed - $beforeChecks) . " bucket/copy checks.\n";
