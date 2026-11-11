<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
require __DIR__ . '/access.php';
use OCA\MediaStorage\Service\PathMediaService;
use OCA\MediaStorage\Db\BucketStore;
$passed = 0;
final class PathBuckets extends BucketStore {
    public function __construct() {}
    public function findByName(string $owner, string $name): ?array { return $owner === 'alice' && $name === 'Other' ? ['id'=>'other-bucket','name'=>'Other'] : null; }
}
$service = new PathMediaService($api,$nodes,new PathBuckets(),$vfs,$storage,$access,deliveryProtection());
$folder = $vfs->create('alice','10.10.2563 0443 KiTKAT 400');
$media = $vfs->create('alice','000013.JPG',$folder['id'],42);
$reader = $tokens->issue('alice','Path reader',['media:read'],time()+900);
$bearer = 'Bearer '.$reader['secret'];
$path = '/10.10.2563 0443 KiTKAT 400/000013.JPG';
check($service->read($bearer,$path,null,true,[])['size']===13,'Owner-wide path finds media without caller IDs');
$grant = $service->issue($bearer,$path,null,60);
check($access->read($grant['access']['id'],$grant['key'],true)['size']===13,'Path-issued grant authorizes exact resource');
foreach (['/../000013.JPG','/a//b','/a/./b',"/a\0b",'/'.str_repeat('x',256)] as $invalid) {
    denied(fn()=> $service->read($bearer,$invalid,null,true,[]),400,'Invalid/traversal path denied');
}
denied(fn()=> $service->read('', $path,null,true,[]),401,'Path never accepts missing bearer');
$manage=$tokens->issue('alice','No read',['media:manage'],time()+900);
denied(fn()=> $service->read('Bearer '.$manage['secret'],$path,null,true,[]),403,'Read scope required for byte path');
$foreign=$tokens->issue('bob','Foreign',['media:read'],time()+900);
denied(fn()=> $service->read('Bearer '.$foreign['secret'],$path,null,true,[]),404,'Path lookup is owner isolated');
$limited=$tokens->issue('alice','Restricted',['media:read'],time()+900,$folder['id']);$limitedHeader='Bearer '.$limited['secret'];
check($service->read($limitedHeader,'/000013.JPG',null,true,[])['name']==='000013.JPG','Restricted path starts at its exact boundary');
denied(fn()=> $service->read($limitedHeader,$path,null,true,[]),404,'Restricted lookup does not silently fall back to owner root');
denied(fn()=> $service->read($limitedHeader,'/000013.JPG','Other',true,[]),400,'Restricted token cannot choose a different bucket');
$vfs->update('alice',$media['id'],null,'other-bucket');
denied(fn()=> $service->read($limitedHeader,'/000013.JPG',null,true,[]),404,'Move outside boundary denies subsequent path read');
check($service->read($bearer,'/000013.JPG','Other',true,[])['size']===13,'Owner-wide bucket selected by exact name');
denied(fn()=> $service->read($bearer,'/000013.JPG','Missing',true,[]),404,'Unknown bucket does not fall back');
$vfs->update('alice',$media['id'],null,$folder['id']);
$part=$service->read($bearer,$path,null,false,['Range'=>'bytes=2-5']);
check($part['status']===206 && $part['length']===4 && fread($part['stream'],4)==='xtur','Direct path uses bounded range plan');fclose($part['stream']);($part['release'])();
$metadata=$service->read($bearer,$path,null,true,[]);
check($service->read($bearer,$path,null,false,['If-None-Match'=>'"'.$metadata['etag'].'"'])['status']===304,'Authorized conditional path read');
$tokens->revoke('alice',$reader['token']['id']);
denied(fn()=> $service->read($bearer,$path,null,true,[]),401,'Revoked bearer cannot use path');
denied(fn()=> $access->read($grant['access']['id'],$grant['key']),404,'Path-issued grant retains issuer revocation');
$streamFails=true;denied(fn()=> $service->read($limitedHeader,'/000013.JPG',null,false,[]),503,'Failed path stream is closed safely');$streamFails=false;
$vfs->update('alice',$media['id'],'100%25.JPG',null);
check($service->read($limitedHeader,'/100%25.JPG',null,true,[])['name']==='100%25.JPG','No second percent decoding of literal names');
$request=double(OCP\IRequest::class,['getMethod'=>fn()=>'HEAD','getHeader'=>fn($name)=>$name==='Authorization'?$limitedHeader:'']);
$controller=new OCA\MediaStorage\Controller\PathMediaController($request,$service,$urls);
check($controller->read('100%25.JPG')->getStatus()===200,'Controller path HEAD works');
$data=$controller->create('/100%25.JPG',null,60)->getData();
check(isset($data['url'],$data['expires_at']) && !isset($data['access'],$data['node_id'],$data['key']),'Path issuance hides internal IDs in JSON');
foreach (['read','create'] as $method) {
 $ref=new ReflectionMethod($controller,$method);
 check(count($ref->getAttributes(OCP\AppFramework\Http\Attribute\PublicPage::class))===1 && count($ref->getAttributes(OCP\AppFramework\Http\Attribute\NoCSRFRequired::class))===1,'Only bearer-authenticated path endpoints use narrow middleware exceptions');
}
$delivery = new OCA\MediaStorage\Controller\DeliveryController($request,$access,deliveryProtection(),$service);
check($delivery->read('100%25.JPG',$limited['secret'])->getStatus()===200,'Query API credential resolves path without node ID');
check($delivery->read('100%25.JPG',$reader['secret'])->getStatus()===401,'Query API credential revocation enforced');
check($delivery->read('100%25.JPG','')->getStatus()===404,'Path without a key stays private');
check($delivery->read('100%25.JPG',$foreign['secret'])->getStatus()===404,'Query credential owner cannot see another owner path');
echo "PASS: $passed path media checks.\n";
