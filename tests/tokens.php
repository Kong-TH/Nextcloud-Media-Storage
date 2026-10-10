<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/MemoryStore.php';
use OCA\MediaStorage\Db\TokenStore;
use OCA\MediaStorage\Service\ApiTokenService;
use OCA\MediaStorage\Service\ScopedApiService;
use OCA\MediaStorage\Service\VirtualFileSystemService;
use OCA\MediaStorage\Service\MediaStorageService;
use OCA\MediaStorage\Service\OwnerCleanupService;
use OCA\MediaStorage\Listener\OwnerLifecycleListener;
use OCA\MediaStorage\Exception\MediaException;
final class MemoryTokens extends TokenStore {
    public array $rows = [];
    public function __construct() {}
    public function find(string $id): ?array { return $this->rows[$id] ?? null; }
    public function listing(string $owner, int $limit = 100, int $offset = 0): array {
        return array_slice(array_values(array_filter($this->rows, fn($row) => $row['owner_id'] === $owner)), $offset, $limit);
    }
    public function insert(array $row): void { $this->rows[$row['id']] = $row; }
    public function update(string $owner, string $id, array $values): void {
        if (($this->rows[$id]['owner_id'] ?? null) !== $owner) throw new RuntimeException('Owner isolation failure');
        $this->rows[$id] = array_replace($this->rows[$id], $values);
    }
}
$passed = 0;
function check(bool $result, string $name): void { global $passed; if (!$result) throw new RuntimeException('FAIL: ' . $name); ++$passed; }
function denied(callable $action, int $status, string $name): void {
    try { $action(); } catch (MediaException $error) { check($error->status === $status, $name); return; }
    throw new RuntimeException('FAIL: Expected denial: ' . $name);
}
$nodes = new MemoryStore(); $repository = new MemoryTokens();
$enabled = true;
$alice = double(OCP\IUser::class, ['getUID' => fn() => 'alice', 'isEnabled' => function () use (&$enabled) { return $enabled; }]);
$bob = double(OCP\IUser::class, ['getUID' => fn() => 'bob', 'isEnabled' => fn() => true]);
$userMap = ['alice' => $alice, 'bob' => $bob];
$users = double(OCP\IUserManager::class, ['get' => function ($uid) use (&$userMap) { return $userMap[$uid] ?? null; }]);
$lifetime = '31536000';
$config = double(OCP\IConfig::class, ['getAppValue' => function () use (&$lifetime) { return $lifetime; }]);
$files = double(OCP\Files\IRootFolder::class, []);
$vfs = new VirtualFileSystemService($nodes, new MediaStorageService($files));
$tokens = new ApiTokenService($repository, $nodes, $vfs, $users, $config);
check($tokens->policy()['max_lifetime_seconds'] === 31536000, 'Default lifetime policy is exposed');
foreach (['1' => 60, '3600' => 3600, '999999999' => 31536000] as $configured => $expected) {
    $lifetime = (string)$configured;
    check($tokens->policy()['max_lifetime_seconds'] === $expected, 'Configured lifetime policy is clamped consistently');
}
$lifetime = '3600';
denied(fn() => $tokens->issue('alice', 'Beyond policy', ['media:read'], time() + 7200), 400, 'Issuance uses the advertised configured policy');
$lifetime = '31536000';
$api = new ScopedApiService($tokens, $nodes, $vfs, deliveryProtection());
$folder = $vfs->create('alice', 'allowed'); $inside = $vfs->create('alice', 'inside', $folder['id']);
$outside = $vfs->create('alice', 'outside'); $bobFolder = $vfs->create('bob', 'bob-only');
$issued = $tokens->issue('alice', 'Read backend', ['media:read'], time() + 3600);
$id = $issued['token']['id']; $header = 'Bearer ' . $issued['secret'];
check(preg_match('/^ms_[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/D', $issued['secret']) === 1, 'Credential has random selector and 256-bit secret');
$secret = explode('.', $issued['secret'])[1];
check($repository->rows[$id]['token_hash'] === hash('sha256', $secret), 'Only verifier stored');
check(!str_contains(json_encode($repository->rows), $secret), 'No plaintext credential in storage');
check(!isset($issued['token']['token_hash']), 'Issue metadata hides verifier');
check(!str_contains(json_encode($tokens->listing('alice')), $secret), 'Listing cannot redisplay secret');
check($tokens->authenticate($header)['owner_id'] === 'alice', 'Valid bearer authenticates owner');
foreach (['', 'Bearer invalid', $header . 'extra', str_replace('Bearer', 'Basic', $header), 'Bearer ms_' . str_repeat('0', 32) . '.' . str_repeat('x', 43)] as $bad) {
    denied(fn() => $tokens->authenticate($bad), 401, 'Malformed or unknown credential denied');
}
$modified = substr($header, 0, -1) . (str_ends_with($header, 'x') ? 'y' : 'x');
denied(fn() => $tokens->authenticate($modified), 401, 'Modified secret denied');
$repository->rows[$id]['expires_at'] = time() - 1;
denied(fn() => $tokens->authenticate($header), 401, 'Expired token denied');
$repository->rows[$id]['expires_at'] = time() + 3600;
$enabled = false;
denied(fn() => $tokens->authenticate($header), 401, 'Disabled owner denied');
$enabled = true; unset($userMap['alice']);
denied(fn() => $tokens->authenticate($header), 401, 'Deleted owner denied');
$userMap['alice'] = $alice;
check($api->access($header, 'media:read', fn($token) => $api->show($token, $inside['id']))['id'] === $inside['id'], 'Authorized metadata read');
check($repository->rows[$id]['last_used_at'] !== null, 'Successful operation records last use');
denied(fn() => $api->access($header, 'media:manage', fn() => true), 403, 'Read token cannot manage');
denied(fn() => $api->access($header, 'media:delete', fn() => true), 403, 'Read token cannot delete');
foreach ([[], ['unknown'], ['media:read', 'media:read'], [['media:read']]] as $scopes) {
    denied(fn() => $tokens->issue('alice', 'bad', $scopes, time() + 3600), 400, 'Invalid scopes rejected');
}
foreach (['', ' leading', "bad\nname", str_repeat('a', 101)] as $name) {
    denied(fn() => $tokens->issue('alice', $name, ['media:read'], time() + 3600), 400, 'Invalid token name rejected');
}
foreach ([time() - 1, time() + 31536001] as $expiry) {
    denied(fn() => $tokens->issue('alice', 'bad-expiry', ['media:read'], $expiry), 400, 'Invalid expiration rejected');
}
denied(fn() => $tokens->issue('alice', 'bad-folder', ['media:read'], time() + 3600, $bobFolder['id']), 404, 'Cross-owner restriction rejected');
denied(fn() => $tokens->issue('alice', 'bad-manager', ['token:manage'], time() + 3600, $folder['id']), 400, 'Restricted manager credential rejected');
$limited = $tokens->issue('alice', 'Limited', ['media:read', 'media:manage', 'media:delete'], time() + 3600, $folder['id']);
$limitedHeader = 'Bearer ' . $limited['secret'];
$limitedRow = $tokens->authenticate($limitedHeader);
$listing = $api->access($limitedHeader, 'media:read', fn($token) => $api->listing($token, null, '', 100, 0));
check($listing['root_id'] === $folder['id'] && count($listing['nodes']) === 1, 'Folder listing stays in restriction');
check($listing['nodes'][0]['virtual_path'] === '/inside', 'Restricted path is relative to boundary');
check(!isset($listing['nodes'][0]['owner_id']), 'Restricted output removes owner/storage internals');
$boundary = $api->show($limitedRow, $folder['id']);
check($boundary['parent_id'] === null && $boundary['virtual_path'] === '/', 'Boundary does not disclose ancestor ID/path');
denied(fn() => $api->contains($limitedRow, $outside['id']), 403, 'Outside folder denied');
denied(fn() => $api->contains($limitedRow, $bobFolder['id']), 404, 'Cross-owner node denied');
denied(fn() => $api->update($limitedRow, $inside['id'], null, $outside['id']), 403, 'Move out of restriction denied');
denied(fn() => $api->update($limitedRow, $outside['id'], null, $folder['id']), 403, 'Move into restriction from outside denied');
denied(fn() => $api->update($limitedRow, $folder['id'], 'changed', null), 403, 'Restricted root rename denied');
denied(fn() => $api->destroy($limitedRow, $folder['id']), 403, 'Restricted root deletion denied');
denied(fn() => $api->create($limitedRow, 'guessed-file.png', null, 1), 403, 'Restricted physical file ID binding denied');
denied(fn() => $api->rebind($limitedRow, $inside['id'], 1), 403, 'Restricted physical file ID replacement denied');
$new = $api->access($limitedHeader, 'media:manage', fn($token) => $api->create($token, 'new-child', null));
check($new['parent_id'] === $folder['id'], 'Restricted create defaults to boundary');
$api->access($limitedHeader, 'media:delete', function ($token) use ($api, $new) { $api->destroy($token, $new['id']); });
denied(fn() => $vfs->show('alice', $new['id']), 404, 'Delete scope removes authorized reference');
$replacement = $tokens->rotate('alice', $id);
check($replacement['secret'] !== $issued['secret'], 'Rotation issues fresh credential');
check($tokens->authenticate($header)['id'] === $id, 'Rotation retains old credential for overlap');
check($tokens->authenticate('Bearer ' . $replacement['secret'])['id'] !== $id, 'Replacement works');
denied(fn() => $tokens->revoke('bob', $id), 404, 'Cannot revoke another owner credential');
$tokens->revoke('alice', $id);
denied(fn() => $tokens->authenticate($header), 401, 'Revoked token denied');
denied(fn() => $tokens->rotate('alice', $id), 409, 'Revoked token cannot rotate');
$tokens->revoke('alice', $id);
check($tokens->listing('alice')[0]['status'] === 'revoked', 'Revocation idempotent and status visible');
// Deleting the restriction does not grant owner-wide access.
$vfs->destroy('alice', $folder['id']);
denied(fn() => $api->contains($limitedRow, $outside['id']), 403, 'Deleted restriction cannot widen access');
// Separate bucket roots do not widen existing default-root or folder restrictions.
$bucketRoot = ['id' => 'test-bucket', 'owner_id' => 'alice', 'parent_id' => '', 'name' => 'Brand', 'name_key' => hash('sha256', 'bucket-alice-brand'), 'node_type' => 'bucket', 'created_at' => time(), 'updated_at' => time(), 'lock_version' => 0];
$nodes->insert($bucketRoot);
$bucketChild = $vfs->create('alice', 'bucket-child', $bucketRoot['id']);
$defaultScoped = $tokens->issue('alice', 'Default only', ['media:read'], time() + 3600, $vfs->root('alice')['id']);
$defaultRow = $tokens->authenticate('Bearer ' . $defaultScoped['secret']);
denied(fn() => $api->contains($defaultRow, $bucketChild['id']), 403, 'Default-root token cannot reach another bucket');
$bucketScoped = $tokens->issue('alice', 'Bucket only', ['media:read', 'media:manage'], time() + 3600, $bucketRoot['id']);
$bucketRow = $tokens->authenticate('Bearer ' . $bucketScoped['secret']);
check($api->show($bucketRow, $bucketChild['id'])['virtual_path'] === '/bucket-child', 'Bucket-scoped paths omit namespace ancestors');
denied(fn() => $api->contains($bucketRow, $outside['id']), 403, 'Bucket-scoped token cannot reach default Library');
denied(fn() => $api->update($bucketRow, $bucketChild['id'], null, $outside['id']), 403, 'Scoped move cannot cross bucket boundary');
$vfs->update('alice', $bucketChild['id'], null, $outside['id']);
denied(fn() => $api->contains($bucketRow, $bucketChild['id']), 403, 'Session move out of bucket removes bucket-token access');
// Lifecycle listener delegates only exact UID and never touches filesystem APIs/passwords.
$cleanup = new class extends OwnerCleanupService {
    public array $owners = [];
    public function __construct() {}
    public function purge(string $owner): void { $this->owners[] = $owner; }
};
$listener = new OwnerLifecycleListener($cleanup);
$listener->handle(new OCP\User\Events\UserDeletedEvent($alice));
$listener->handle(new OCP\User\Events\UserCreatedEvent($alice, 'not-read-by-listener'));
$listener->handle(new OCP\EventDispatcher\Event());
check($cleanup->owners === ['alice', 'alice'], 'Deletion/recreation cleanup registered by UID');
$context = double(OCP\AppFramework\Bootstrap\IRegistrationContext::class, ['registerEventListener' => function ($event, $handler) use (&$registered) { $registered[$event] = $handler; }]);
$application = (new ReflectionClass(OCA\MediaStorage\AppInfo\Application::class))->newInstanceWithoutConstructor();
$application->register($context);
check(count($registered) === 2 && isset($registered[OCP\User\Events\UserDeletedEvent::class]), 'Bootstrap registers lifecycle listeners');
$request = double(OCP\IRequest::class, ['getHeader' => fn() => '']);
$external = new OCA\MediaStorage\Controller\ExternalController($request, $api, $tokens);
$response = $external->index();
check($response->getStatus() === 401 && isset((new ReflectionProperty(OCP\AppFramework\Http\Response::class, 'headers'))->getValue($response)['WWW-Authenticate']), 'External request requires bearer even without session');
check((new ReflectionProperty(OCP\AppFramework\Http\Response::class, 'headers'))->getValue($response)['Cache-Control'] === 'no-store', 'Credential errors are never cacheable');
$session = double(OCP\IUserSession::class, ['getUser' => fn() => $alice]);
$controller = new OCA\MediaStorage\Controller\TokenController($request, $session, $tokens);
foreach (['create', 'destroy', 'rotate'] as $method) {
    $reflection = new ReflectionMethod($controller, $method);
    check($reflection->getAttributes(OCP\AppFramework\Http\Attribute\NoCSRFRequired::class) === [] && $reflection->getAttributes(OCP\AppFramework\Http\Attribute\PublicPage::class) === [], 'Token dashboard retains middleware: ' . $method);
}
check((new ReflectionProperty(OCP\AppFramework\Http\Response::class, 'headers'))->getValue($controller->index())['Cache-Control'] === 'no-store', 'Token metadata uses no-store');
check($controller->index()->getData()['policy']['max_lifetime_seconds'] === 31536000, 'Session token listing includes authoritative policy');
check(abs($controller->index()->getData()['policy']['server_time'] - time()) <= 1, 'Policy exposes current server time');
$deletedBoundary = $vfs->create('alice', 'Deleted boundary');
$bound = $tokens->issue('alice', 'Deleted boundary reader', ['media:read'], time() + 3600, $deletedBoundary['id']);
$boundHeader = 'Bearer ' . $bound['secret'];
$vfs->destroy('alice', $deletedBoundary['id']);
check($tokens->authenticate($boundHeader)['folder_id'] === $deletedBoundary['id'], 'Deleted token boundary is retained, never reset to owner-wide');
denied(fn() => $api->access($boundHeader, 'media:read', fn($token) => $api->listing($token, null, '', 100, 0)), 404, 'Deleted boundary cannot be listed');
denied(fn() => $api->access($boundHeader, 'media:read', fn($token) => $api->show($token, $outside['id'])), 403, 'Deleted boundary cannot authorize surviving siblings');
echo "PASS: $passed token/scope/lifecycle checks using strict public-interface doubles.\n";
