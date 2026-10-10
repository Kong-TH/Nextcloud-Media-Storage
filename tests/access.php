<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
require __DIR__ . '/tokens.php';
use OCA\MediaStorage\Db\AccessStore;
use OCA\MediaStorage\Service\TemporaryAccessService;
use OCA\MediaStorage\Service\ApiTokenService;
use OCA\MediaStorage\Service\ScopedApiService;
use OCA\MediaStorage\Service\MediaStorageService;
use OCA\MediaStorage\Service\VirtualFileSystemService;
use OCA\MediaStorage\Exception\MediaException;
final class MemoryAccess extends AccessStore {
    public array $rows = [];
    public mixed $onFind = null;
    public function __construct() {}
    public function find(string $id): ?array { if ($this->onFind !== null) { ($this->onFind)($id); } return $this->rows[$id] ?? null; }
    public function insert(array $row): void { $this->rows[$row['id']] = $row; }
    public function listing(string $owner, string $node, int $limit, int $offset): array { return array_slice(array_values(array_filter($this->rows, fn($r) => $r['owner_id'] === $owner && $r['node_id'] === $node)), $offset, $limit); }
    public function revoke(string $owner, string $id, int $at): void {
        if ($this->rows[$id]['owner_id'] !== $owner) throw new LogicException('Owner mismatch');
        $this->rows[$id]['revoked_at'] ??= $at;
    }
}
$passed = 0; $nodes = new MemoryStore(); $repository = new MemoryTokens(); $grants = new MemoryAccess();
$etag = 'version-one'; $readable = true; $storageId = 'fixture-storage'; $mime = 'image/png'; $opens = 0; $streamFails = false;
$physicalStorage = double(OCP\Files\Storage\IStorage::class, ['getId' => function () use (&$storageId) { return $storageId; }]);
$file = double(OCP\Files\File::class, ['getId' => fn() => 42, 'getPath' => fn() => '/alice/files/fixture.png',
    'getStorage' => fn() => $physicalStorage, 'getSize' => fn() => 13, 'getMTime' => fn() => 1700000000,
    'getMimeType' => function () use (&$mime) { return $mime; }, 'getEtag' => function () use (&$etag) { return $etag; },
    'isReadable' => function () use (&$readable) { return $readable; },
    'fopen' => function ($mode) use (&$opens, &$streamFails) { ++$opens; if ($streamFails) return false; $s = fopen('php://temp', 'w+b'); fwrite($s, 'fixture-bytes'); rewind($s); return $s; }]);
$available = true;
$home = double(OCP\Files\Folder::class, ['getById' => function ($id) use ($file, &$available) { return $available && $id === 42 ? [$file] : []; }, 'getRelativePath' => fn() => 'fixture.png']);
$root = double(OCP\Files\IRootFolder::class, ['getUserFolder' => fn() => $home]);
$storage = new MediaStorageService($root); $vfs = new VirtualFileSystemService($nodes, $storage);
$config = double(OCP\IConfig::class, ['getAppValue' => fn($app, $key, $default) => $default]);
$tokens = new ApiTokenService($repository, $nodes, $vfs, $users, $config);
$api = new ScopedApiService($tokens, $nodes, $vfs, deliveryProtection());
$access = new TemporaryAccessService($grants, $nodes, $repository, $tokens, $api, $storage, $config);
$folder = $vfs->create('alice', 'shared'); $other = $vfs->create('alice', 'outside');
$media = $vfs->create('alice', 'alias.png', $folder['id'], 42); $nodeId = $media['id'];
$issue = fn(?int $ttl = null) => $access->issue('alice', $nodeId, $ttl);
$grant = $issue(); $id = $grant['access']['id']; $key = $grant['key'];
foreach (['1'=>60, '7200'=>7200, '99999999'=>86400] as $configured=>$maximum) {
    $policyConfig=double(OCP\IConfig::class,['getAppValue'=>fn()=> (string)$configured]);
    $policyService=new TemporaryAccessService($grants,$nodes,$repository,$tokens,$api,$storage,$policyConfig);
    check($policyService->policy()['max_ttl_seconds']===$maximum,'Temporary lifetime configuration clamps safely');
}
$routes=(new OC\AppFramework\Routing\RouteParser())->parseDefaultRoutes(require dirname(__DIR__).'/appinfo/routes.php','mediastorage');
check($routes->get('mediastorage.externalaccess.create')->getDefault('caller')===['mediastorage','ExternalAccessController','create'],'Nextcloud parser resolves external controller');
check($routes->get('mediastorage.delivery.read')->getMethods()===['GET'] && $routes->get('mediastorage.delivery.readhead')->getMethods()===['HEAD'],'GET/HEAD route names remain distinct');
$generator=new Symfony\Component\Routing\Generator\UrlGenerator($routes,new Symfony\Component\Routing\RequestContext());
check(str_contains($generator->generate('mediastorage.delivery.read',['id'=>$id,'key'=>$key]),'?key='.$key),'Framework route generator appends temporary key correctly');

check($access->policy()['max_ttl_seconds'] === 3600 && $grant['access']['expires_at'] - time() <= 900, 'Bounded default lifetime');
check(strlen($key) === 43 && $grants->rows[$id]['secret_hash'] === hash('sha256', $key), '256-bit random secret verifier only');
check(!str_contains(json_encode($grants->rows), $key), 'Plaintext secret never persisted');
$listing = $access->listing('alice', $nodeId);
check(!str_contains(json_encode($listing), $key) && !isset($listing['access'][0]['secret_hash'], $listing['access'][0]['file_id']), 'Listing omits credential and physical internals');
foreach ([0, -1, 3601] as $ttl) denied(fn() => $issue($ttl), 400, 'Invalid TTL denied');
denied(fn() => $access->issue('bob', $nodeId), 404, 'Cannot issue for another owner');
denied(fn() => $access->issue('alice', $folder['id']), 404, 'Folder is not a deliverable resource');
denied(fn() => $access->listing('bob', $nodeId), 404, 'Foreign grant listing denied');
denied(fn() => $access->listing('alice', $nodeId, 101), 400, 'Pagination bounded');
foreach ([['bad', $key], [$id, 'bad'], [str_repeat('0',32), $key], [$id, str_repeat('x',43)], [$id, $key . 'extra']] as [$selector,$secret]) denied(fn() => $access->read($selector,$secret), 404, 'Malformed/unknown/tampered capability denied uniformly');
$result = $access->read($id, $key);
check(stream_get_contents($result['stream']) === 'fixture-bytes' && $result['name'] === 'alias.png', 'Authorized read streams exact bytes using virtual alias'); fclose($result['stream']);
$count = $opens; check($access->read($id, $key, true)['stream'] === null && $opens === $count, 'HEAD authorizes without opening stream');
$otherGrant = $issue(); denied(fn() => $access->read($otherGrant['access']['id'], $key), 404, 'Resource selector substitution denied');
$grants->rows[$id]['expires_at'] = time(); denied(fn() => $access->read($id,$key), 404, 'Exact expiry boundary denies'); $grants->rows[$id]['expires_at'] = time()+900;
$enabled = false; denied(fn() => $access->read($id,$key), 404, 'Disabled owner denied uniformly'); $enabled = true;
unset($userMap['alice']); denied(fn() => $access->read($id,$key), 404, 'Deleted owner denied'); $userMap['alice'] = $alice;
foreach (['readable', 'available'] as $field) { $$field = false; denied(fn() => $access->read($id,$key),404,'Current physical availability rechecked'); $$field = true; }
$etag = 'changed'; denied(fn() => $access->read($id,$key),404,'Changed content ETag denied'); $etag='version-one';
$storageId='replacement-storage'; denied(fn() => $access->read($id,$key),404,'Changed storage denied'); $storageId='fixture-storage';
$mime='text/html'; denied(fn() => $access->read($id,$key),404,'Unsupported current MIME denied'); $mime='image/png';
$nodes->bindings[$nodeId]['nextcloud_file_id']=43; denied(fn() => $access->read($id,$key),404,'Rebind cannot substitute another original'); $nodes->bindings[$nodeId]['nextcloud_file_id']=42;
$vfs->update('alice',$nodeId,'renamed.png',$other['id']); check($access->read($id,$key,true)['name']==='renamed.png','Same-bucket virtual rename/move retains exact original access');
$bucket=['id'=>'other-bucket','owner_id'=>'alice','parent_id'=>'','name'=>'Other','name_key'=>hash('sha256','other-bucket'),'node_type'=>'bucket','created_at'=>time(),'updated_at'=>time(),'lock_version'=>0]; $nodes->insert($bucket);
$vfs->update('alice',$nodeId,null,$bucket['id']); denied(fn() => $access->read($id,$key),404,'Moving to another bucket denies pinned grant'); $vfs->update('alice',$nodeId,null,$folder['id']);
$bearer=$tokens->issue('alice','Reader',['media:read'],time()+120,$folder['id']); $token=$tokens->authenticate('Bearer '.$bearer['secret']);
$limited=$access->issue('alice',$nodeId,3600,$token); $lid=$limited['access']['id']; $lkey=$limited['key'];
check($limited['access']['expires_at']===$token['expires_at'],'Grant cannot outlive issuer');
check($access->read($lid,$lkey,true)['size']===13,'Scoped issuer grant works');
$vfs->update('alice',$nodeId,null,$other['id']); denied(fn() => $access->read($lid,$lkey),404,'Moving outside issuer boundary denies access'); denied(fn() => $access->issue('alice',$nodeId,60,$token),403,'Issuance enforces current folder restriction'); $vfs->update('alice',$nodeId,null,$folder['id']);
$repository->rows[$token['id']]['expires_at']=time(); denied(fn() => $access->read($lid,$lkey),404,'Current issuer expiry rechecked'); $repository->rows[$token['id']]['expires_at']=time()+120;
$repository->rows[$token['id']]['scopes']='["media:manage"]'; denied(fn() => $access->read($lid,$lkey),404,'Read scope not implied by manage'); $repository->rows[$token['id']]['scopes']='["media:read"]';
$tokens->revoke('alice',$token['id']); denied(fn() => $access->read($lid,$lkey),404,'Issuer revocation invalidates derived grant');
$next=$tokens->issue('alice','Other reader',['media:read'],time()+120); $nextToken=$tokens->authenticate('Bearer '.$next['secret']);
denied(fn() => $access->revoke('alice',$id,$nextToken),404,'Bearer cannot revoke session-issued grant');
denied(fn() => $access->revoke('alice',$lid,$nextToken),404,'Bearer cannot revoke another issuer grant');
$own=$access->issue('alice',$nodeId,60,$nextToken); $access->revoke('alice',$own['access']['id'],$nextToken); denied(fn() => $access->read($own['access']['id'],$own['key']),404,'Issuer can revoke own grant');
denied(fn() => $access->revoke('bob',$id),404,'Cross-owner revocation denied');
$streamFails=true; denied(fn() => $access->read($id,$key),503,'Failed stream opening returns safe retryable error'); $streamFails=false;
$requestMethod='GET'; $request=double(OCP\IRequest::class,['getMethod'=>function () use (&$requestMethod) { return $requestMethod; },'getHeader'=>fn()=> '']);
$delivery=new OCA\MediaStorage\Controller\DeliveryController($request,$access,deliveryProtection());
$requestMethod='HEAD'; $response=$delivery->read($id,$key); $headers=(new ReflectionProperty(OCP\AppFramework\Http\Response::class,'headers'))->getValue($response);
check($response->getStatus()===200 && $headers['Content-Length']==='13','HEAD returns authorized metadata');
check($response instanceof OCP\AppFramework\Http\ICallbackResponse,'HEAD bypasses framework empty-body length rewrite');
$response->callback(double(OCP\AppFramework\Http\IOutput::class,[]));
check($headers['Cache-Control']==='private, no-store' && $headers['Referrer-Policy']==='no-referrer' && $headers['X-Content-Type-Options']==='nosniff','Delivery prevents cache/referrer/MIME confusion');
check(str_contains($headers['Content-Disposition'],'renamed.png') && !str_contains(json_encode($headers),'/alice/files'),'Delivery does not disclose physical filename/path');
$mime='image/svg+xml'; check($delivery->read($id,$key)->getStatus()===404,'Active SVG format remains excluded'); $mime='image/png';
check($delivery->read($id)->getStatus()===404,'Session/header cannot replace URL capability');
$session=double(OCP\IUserSession::class,['getUser'=>fn()=> $alice]);
$urls=double(OCP\IURLGenerator::class,['linkToRouteAbsolute'=>fn($route,$params)=> 'https://example.test/plugin/delivery/'.$params['id'].'?key='.$params['key']]);
$management=new OCA\MediaStorage\Controller\AccessController($request,$session,$access,$urls);
$issued=$management->create($nodeId,60);
check($issued->getStatus()===201 && isset($issued->getData()['url']) && !isset($issued->getData()['key']),'Session response returns one-time generated delivery URL');
foreach (['create','index','destroy'] as $method) { $ref=new ReflectionMethod($management,$method); check(!$ref->getAttributes(OCP\AppFramework\Http\Attribute\PublicPage::class) && !$ref->getAttributes(OCP\AppFramework\Http\Attribute\NoCSRFRequired::class),'Session management keeps auth/CSRF: '.$method); }
$external=new OCA\MediaStorage\Controller\ExternalAccessController($request,$api,$access,$urls); check($external->create($nodeId)->getStatus()===401,'External management never accepts cookie-only auth');
$raced=$issue(); $finds=0;
$grants->onFind=function ($selector) use ($grants,$raced,&$finds) { if ($selector===$raced['access']['id'] && ++$finds===2) { $grants->rows[$selector]['revoked_at']=time(); } };
denied(fn()=> $access->read($raced['access']['id'],$raced['key']),404,'Revocation between initial lookup and owner lock is rechecked'); $grants->onFind=null;
$access->revoke('alice',$id); $access->revoke('alice',$id); denied(fn()=> $access->read($id,$key),404,'Revocation is idempotent and enforced');
check($access->listing('alice',$nodeId)['access'][0]['status']==='revoked','Revocation status visible without secret');
$removed=$issue(); $vfs->destroy('alice',$folder['id']); denied(fn()=> $access->read($removed['access']['id'],$removed['key']),404,'Deleted reference/subtree denies grant');
check($access->revoke('alice',$removed['access']['id'])===null,'Owner can revoke after resource deletion');
echo "PASS: $passed temporary access checks using strict public-interface doubles.\n";
