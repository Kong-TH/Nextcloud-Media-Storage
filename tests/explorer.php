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
    public function __construct() {}
    public function listing(string $owner, int $limit, int $offset): array { return array_slice(array_values(array_filter($this->rows, fn($r) => $r['owner_id'] === $owner)), $offset, $limit); }
    public function exists(string $owner, string $name): bool { return (bool)array_filter($this->rows, fn($r) => $r['owner_id'] === $owner && $r['name'] === $name); }
    public function insert(array $row): void { $this->rows[$row['id']] = $row; }
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
echo 'PASS: ' . ($passed - $beforeChecks) . " bucket/copy checks.\n";
