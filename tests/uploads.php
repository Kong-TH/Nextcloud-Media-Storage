<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
require __DIR__ . '/run.php';
use OCA\MediaStorage\Db\UploadStore;
use OCA\MediaStorage\Service\UploadRules;
use OCA\MediaStorage\Service\UploadService;
use OCA\MediaStorage\Service\MediaStorageService;
use OCA\MediaStorage\Service\VirtualFileSystemService;
use OCP\Files\Folder;
use OCP\Files\File;
use OCP\Files\IRootFolder;
use OCP\Files\Storage\IStorage;
use OCP\Files\IMimeTypeDetector;
use OCP\IConfig;
$passed = 0;
class MemoryUploads extends UploadStore {
    public array $rows = [];
    public function __construct() {}
    public function find(string $owner, string $id): ?array { return $this->rows[$owner . ':' . $id] ?? null; }
    public function insert(array $row): void { $key = $row['owner_id'] . ':' . $row['id']; if (isset($this->rows[$key])) throw new LogicException('Duplicate upload'); $this->rows[$key] = $row; }
    public function complete(string $owner, string $id, string $node): void { $this->rows[$owner . ':' . $id]['state'] = 'complete'; $this->rows[$owner . ':' . $id]['node_id'] = $node; }
}
$physicalFiles = []; $folderPaths = []; $folderOwners = []; $canCreate = true; $freeSpace = 1000000; $storedMime = 'image/png'; $currentMime = 'image/png'; $readableOriginal = true;
$consumeStream = true;
$physicalStorage = double(IStorage::class, ['getId' => fn() => 'upload-fixture']);
$makeFolder = function (string $owner, string $path) use (&$makeFolder, &$physicalFiles, &$folderPaths, &$folderOwners, &$canCreate, &$freeSpace, &$storedMime, &$readableOriginal, &$consumeStream, $physicalStorage) {
    if (isset($folderPaths[$owner . ':' . $path])) return $folderPaths[$owner . ':' . $path];
    $children = [];
    $folder = double(Folder::class, [
        'getOwner' => function () use (&$folderOwners, $owner, $path) { return double(\OCP\IUser::class, ['getUID' => fn() => $folderOwners[$owner . ':' . $path] ?? $owner]); },
        'isCreatable' => function () use (&$canCreate) { return $canCreate; },
        'getFreeSpace' => function () use (&$freeSpace) { return $freeSpace; },
        'nodeExists' => function ($name) use (&$children) { return isset($children[$name]); },
        'get' => function ($name) use (&$children) { return $children[$name] ?? throw new OCP\Files\NotFoundException(); },
        'newFolder' => function ($name) use (&$children, &$makeFolder, $owner, $path) { return $children[$name] = $makeFolder($owner, $path . '/' . $name); },
        'newFile' => function ($name, $stream) use (&$children, &$physicalFiles, &$storedMime, &$readableOriginal, &$consumeStream, $owner, $path, $physicalStorage) {
            if (isset($children[$name])) throw new LogicException('Attempt to overwrite original');
            $id = count($physicalFiles) + 1; $bytes = stream_get_contents($stream);
            // Match Nextcloud View::file_put_contents: the filesystem consumes the stream.
            if ($consumeStream) { fclose($stream); }
            $filePath = '/' . $owner . '/files' . $path . '/' . $name;
            $record = (object)['bytes' => $bytes, 'path' => $filePath, 'owner' => $owner, 'mime' => $storedMime];
            $f = double(File::class, ['getId' => fn() => $id, 'isReadable' => function () use (&$readableOriginal) { return $readableOriginal; },
                'getStorage' => fn() => $physicalStorage, 'getPath' => fn() => $record->path, 'getSize' => fn() => strlen($record->bytes),
                'getMimeType' => fn() => $record->mime, 'fopen' => function () use ($record) { $s = fopen('php://temp', 'w+b'); fwrite($s, $record->bytes); rewind($s); return $s; }]);
            $physicalFiles[$id] = [$f, $record]; return $children[$name] = $f;
        },
        'getById' => function ($id) use (&$physicalFiles, $owner) { return isset($physicalFiles[$id]) && $physicalFiles[$id][1]->owner === $owner ? [$physicalFiles[$id][0]] : []; },
        'getRelativePath' => fn($value) => substr($value, strlen('/' . $owner . '/files/')),
    ]);
    return $folderPaths[$owner . ':' . $path] = $folder;
};
$homes = ['alice' => $makeFolder('alice', ''), 'bob' => $makeFolder('bob', '')];
$root = double(IRootFolder::class, ['getUserFolder' => fn($owner) => $homes[$owner]]);
$detector = double(IMimeTypeDetector::class, ['detectContent' => function () use (&$currentMime) { return $currentMime; }]);
$maximum = '100000';
$config = double(IConfig::class, ['getAppValue' => function () use (&$maximum) { return $maximum; }, 'getUserValue' => fn() => 'Asia/Bangkok']);
$nodes = new MemoryStore(); $journal = new MemoryUploads(); $storage = new MediaStorageService($root); $vfs = new VirtualFileSystemService($nodes, $storage);
$service = new UploadService($root, $detector, $config, $nodes, $journal, $vfs);
$alice = $vfs->root('alice')['id']; $bob = $vfs->root('bob')['id'];
$temp = tempnam(sys_get_temp_dir(), 'ms-upload-test-');
try {
    file_put_contents($temp, 'fixture-png-bytes');
    check(UploadRules::bytes('2M') === 2097152 && UploadRules::bytes('1G') === 1073741824, 'PHP size units');
    check(UploadRules::date(strtotime('2026-10-10T22:00:00Z'), 'Asia/Bangkok') === '2026-10-11', 'Account date crosses UTC midnight correctly');
    check(UploadRules::date(0, 'invalid-zone') === '1970-01-01', 'Invalid timezone falls back to UTC');
    denied(fn() => $service->accept('alice', '../bad', 'test.png', $alice, $temp), 400, 'Invalid upload ID denied');
    denied(fn() => $service->accept('alice', str_repeat('a',32), '../bad', $alice, $temp), 400, 'Invalid alias denied');
    denied(fn() => $service->accept('alice', str_repeat('a',32), 'test.png', $bob, $temp), 404, 'Foreign parent denied before original creation');
    check(count($physicalFiles) === 0, 'No physical files for invalid parent');
    $currentMime = 'text/html'; denied(fn() => $service->accept('alice', str_repeat('a',32), 'test.png', $alice, $temp), 415, 'Content MIME overrides extension'); $currentMime = 'image/png';
    $maximum = '2'; denied(fn() => $service->accept('alice', str_repeat('a',32), 'test.png', $alice, $temp), 413, 'Actual size enforces policy'); $maximum = '100000';
    denied(fn() => $service->upload('alice', str_repeat('a',32), 'test.png', $alice, ['error' => UPLOAD_ERR_PARTIAL]), 400, 'Partial transfer denied');
    denied(fn() => $service->upload('alice', str_repeat('a',32), 'test.png', $alice, ['error' => UPLOAD_ERR_INI_SIZE]), 413, 'PHP oversize error is actionable');
    denied(fn() => $service->upload('alice', str_repeat('a',32), 'test.png', $alice, ['error' => UPLOAD_ERR_OK, 'tmp_name' => $temp]), 400, 'Client cannot submit arbitrary local path');
    $canCreate = false; denied(fn() => $service->accept('alice', str_repeat('a',32), 'test.png', $alice, $temp), 403, 'Unwritable upload destination denied'); $canCreate = true;
    $freeSpace = 1; denied(fn() => $service->accept('alice', str_repeat('a',32), 'test.png', $alice, $temp), 507, 'Quota denied without creating original'); $freeSpace = 1000000;
    $result = $service->accept('alice', str_repeat('a',32), 'test.png', $alice, $temp);
    check($result['state'] === 'complete' && $result['node']['name'] === 'test.png', 'First upload succeeds when Nextcloud closes the supplied stream');
    check(count($physicalFiles) === 1 && $physicalFiles[1][1]->bytes === 'fixture-png-bytes', 'One exact-byte original created');
    check((bool)preg_match('#/alice/files/Media Storage/\d{4}-\d{2}-\d{2}/[a-f0-9]{32}\.png$#', $physicalFiles[1][1]->path), 'Daily physical storage with safe unique name');
    check($service->accept('alice', str_repeat('a',32), 'test.png', $alice, $temp) === $result && count($physicalFiles) === 1, 'Identical retry returns committed reference');
    denied(fn() => $service->accept('alice', str_repeat('a',32), 'changed.png', $alice, $temp), 409, 'Same ID different alias denied');
    file_put_contents($temp, 'different bytes'); denied(fn() => $service->accept('alice', str_repeat('a',32), 'test.png', $alice, $temp), 409, 'Same ID different content denied'); file_put_contents($temp, 'fixture-png-bytes');
    denied(fn() => $service->accept('alice', str_repeat('b',32), 'test.png', $alice, $temp), 409, 'Duplicate virtual name rejected before adding original');
    check($service->status('bob', str_repeat('a',32))['state'] === 'not_received', 'Journal hidden from other account');
    $consumeStream = false;
    $bobResult = $service->accept('bob', str_repeat('a',32), 'test.png', $bob, $temp);
    $consumeStream = true;
    check($bobResult['state'] === 'complete', 'Upload also succeeds when storage leaves the input stream open');
    check($bobResult['node']['owner_id'] === 'bob' && count($physicalFiles) === 2, 'Same request ID and alias isolated across users');
    $folderOwners['alice:/Media Storage'] = 'bob';
    denied(fn() => $service->accept('alice', str_repeat('f',32), 'shared.png', $alice, $temp), 403, 'Incoming shared upload folder rejected');
    check(count($physicalFiles) === 2, 'Shared destination rejection adds no original');
    unset($folderOwners['alice:/Media Storage']);
    $physicalFiles[1][1]->path = '/alice/files/Moved/test.png';
    check($vfs->show('alice', $result['node']['id'])['binding']['last_known_path'] === 'Moved/test.png', 'Moving original in Nextcloud retains binding');
    $vfs->destroy('alice', $result['node']['id']);
    check(count($physicalFiles) === 2 && $service->status('alice', str_repeat('a',32))['state'] === 'removed', 'Deleting link preserves original and completed journal');
    denied(fn() => $service->accept('alice', str_repeat('a',32), 'test.png', $alice, $temp), 410, 'Retry never recreates a deleted reference');
    // Force a post-write binding failure: retain the original and reservation, then recover.
    $storedMime = 'text/html'; denied(fn() => $service->accept('alice', str_repeat('c',32), 'recover.png', $alice, $temp), 415, 'Post-write validation failure remains explicit');
    check(count($physicalFiles) === 3 && $service->status('alice', str_repeat('c',32))['state'] === 'pending', 'Pending reservation survives after physical write');
    $physicalFiles[3][1]->mime = 'image/png'; $storedMime = 'image/png';
    $recovered = $service->accept('alice', str_repeat('c',32), 'recover.png', $alice, $temp);
    check($recovered['state'] === 'complete' && count($physicalFiles) === 3, 'Retry recovers matching original without overwrite');
    $previewAvailable = true; $previewCalls = [];
    $simple = double(\OCP\Files\SimpleFS\ISimpleFile::class, ['getName' => fn() => 'preview.png', 'getETag' => fn() => 'fixture-etag',
        'getMTime' => fn() => 1000, 'getMimeType' => fn() => 'image/png']);
    $previewer = double(\OCP\IPreview::class, ['isAvailable' => function () use (&$previewAvailable) { return $previewAvailable; },
        'getPreview' => function ($file, $width, $height) use ($simple, &$previewCalls) { $previewCalls[] = [$width, $height]; return $simple; }]);
    $currentOwner = 'alice';
    $session = double(\OCP\IUserSession::class, ['getUser' => function () use (&$currentOwner) { return $currentOwner === null ? null : double(\OCP\IUser::class, ['getUID' => fn() => $currentOwner]); }]);
    $request = double(\OCP\IRequest::class, []);
    $urls = double(\OCP\IURLGenerator::class, ['getBaseUrl' => fn() => 'https://cloud.example/subpath']);
    $previewController = new \OCA\MediaStorage\Controller\PreviewController($request, $session, $nodes, $storage, $previewer, $urls);
    check($previewController->image($recovered['node']['id'])->getStatus() === 200, 'Authorized Nextcloud preview response');
    check($previewCalls === [[96,96]], 'Thumbnail dimensions bounded');
    $previewController->image($recovered['node']['id'], 'large');
    check($previewCalls[1] === [1280,960], 'Detail dimensions bounded');
    $previewController->image($recovered['node']['id'], '999999');
    check($previewCalls[2] === [96,96], 'Arbitrary preview dimension rejected by fixed presets');
    $redirect = $previewController->content($recovered['node']['id']);
    check($redirect->getStatus() === 303 && str_starts_with($redirect->getRedirectURL(), 'https://cloud.example/subpath/remote.php/dav/files/alice/Media%20Storage/'), 'Session content delegates current authorized path to DAV');
    $previewAvailable = false; check($previewController->image($recovered['node']['id'])->getStatus() === 404, 'Disabled provider has explicit fallback'); $previewAvailable = true;
    $readableOriginal = false; check($previewController->content($recovered['node']['id'])->getStatus() === 404, 'Revoked original readability blocks delivery'); $readableOriginal = true;
    $currentOwner = 'bob'; check($previewController->image($recovered['node']['id'])->getStatus() === 404, 'Cross-owner preview denied');
    $currentOwner = null; check($previewController->content($recovered['node']['id'])->getStatus() === 401, 'Anonymous content denied'); $currentOwner = 'alice';
    $method = new ReflectionMethod(\OCA\MediaStorage\Controller\UploadController::class, 'create');
    check(!$method->getAttributes(\OCP\AppFramework\Http\Attribute\NoCSRFRequired::class) && !$method->getAttributes(\OCP\AppFramework\Http\Attribute\PublicPage::class), 'Upload retains session and CSRF middleware');
    $storedMime = 'text/html'; denied(fn() => $service->accept('alice', str_repeat('d',32), 'partial.png', $alice, $temp), 415, 'Second failure fixture');
    $physicalFiles[4][1]->bytes = 'partial';
    denied(fn() => $service->accept('alice', str_repeat('d',32), 'partial.png', $alice, $temp), 409, 'Partial original is never overwritten');
    check($physicalFiles[4][1]->bytes === 'partial', 'Recovery failure preserves physical contents');
    file_put_contents($temp, ''); denied(fn() => $service->accept('alice', str_repeat('e',32), 'empty.png', $alice, $temp), 400, 'Empty originals denied');
    echo 'PASS: ' . $passed . " upload storage/retry/isolation checks using strict public-interface doubles; not a live upload result.\n";
} finally { unlink($temp); }
