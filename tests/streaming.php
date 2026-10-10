<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
require __DIR__ . '/access.php';
use OCA\MediaStorage\Service\DeliveryRules;
use OCA\MediaStorage\Service\DeliveryProtectionService;
use OCA\MediaStorage\Http\BoundedStreamResponse;
$passed = 0;
$metadata = ['size'=>13,'mtime'=>1700000000,'etag'=>'fixture'];
foreach ([['bytes=0-3',206,0,4],['bytes=5-',206,5,8],['bytes=-4',206,9,4],['bytes=0-999999999999999999999',206,0,13],['bytes=-999999999999999999999',206,0,13],['bytes=999999999999999999999-',416,13,0],['bytes=-0',416,13,0],['bytes=5-2',416,5,0],['bytes=13-',416,13,0],['bytes=0-1,4-5',416,0,0],['items=0-2',200,0,13],['bytes=bad',200,0,13],['bytes=-',200,0,13]] as [$range,$status,$offset,$length]) {
    $plan=DeliveryRules::plan($metadata,['Range'=>$range],false);
    check([$plan['status'],$plan['offset'],$plan['length']]===[$status,$offset,$length],'Bounded range: '.$range);
}
check(DeliveryRules::plan(['size'=>0]+$metadata,['Range'=>'bytes=0-'],false)['status']===416,'Empty representation cannot satisfy range');
check(DeliveryRules::plan($metadata,['Range'=>'bytes=0-3'],true)['length']===13,'HEAD ignores Range');
$date=gmdate('D, d M Y H:i:s',1700000000).' GMT';
foreach ([['If-None-Match'=>'W/"fixture"'],['If-None-Match'=>'"other", "fixture"'],['If-None-Match'=>'*'],['If-Modified-Since'=>$date]] as $conditions) {
    $plan=DeliveryRules::plan($metadata,$conditions,false);
    check($plan['status']===304 && !$plan['body'] && !isset($plan['headers']['Content-Length']),'Conditional not modified has no stream or length');
}
foreach ([['If-Match'=>'W/"fixture"'],['If-Match'=>'"other"'],['If-Unmodified-Since'=>'Mon, 13 Nov 2023 22:13:20 GMT']] as $conditions) check(DeliveryRules::plan($metadata,$conditions,false)['status']===412,'Failed write precondition precedes reads');
check(DeliveryRules::plan($metadata,['If-Match'=>'"other"','If-None-Match'=>'*'],false)['status']===412,'If-Match wins over If-None-Match');
check(DeliveryRules::plan($metadata,['If-None-Match'=>'"other"','If-Modified-Since'=>$date],false)['status']===200,'Entity tag condition takes precedence over date');
foreach (['"fixture"'=>206,$date=>206,'W/"fixture"'=>200,'"different"'=>200,'invalid'=>200] as $validator=>$expected) check(DeliveryRules::plan($metadata,['Range'=>'bytes=0-3','If-Range'=>$validator],false)['status']===$expected,'If-Range controls partial delivery');
denied(fn()=>DeliveryRules::plan($metadata,['Range'=>str_repeat('x',8193)],false),400,'Oversized header rejected');
$settings=[]; $system=[]; $requestHeaders=[]; $registered=[]; $held=[]; $released=[];
$config=double(OCP\IConfig::class,['getAppValue'=>function($app,$key,$default)use(&$settings){return $settings[$key]??$default;},'getSystemValueBool'=>function($key,$default)use(&$system){return $system[$key]??$default;},'getSystemValueInt'=>fn($key,$default)=>$default]);
$request=double(OCP\IRequest::class,['getRemoteAddress'=>fn()=>'192.0.2.1','getHeader'=>function($key)use(&$requestHeaders){return $requestHeaders[$key]??'';}]);
$limiter=double(OCP\Security\RateLimiting\ILimiter::class,['registerAnonRequest'=>function(...$args)use(&$registered){$registered[]=$args;}]);
$locks=double(OCP\Lock\ILockingProvider::class,['acquireLock'=>function($key,$type)use(&$held){if(isset($held[$key]))throw new OCP\Lock\LockedException($key);$held[$key]=true;},'releaseLock'=>function($key,$type)use(&$held,&$released){unset($held[$key]);$released[]=$key;}]);
$protection=new DeliveryProtectionService($config,$request,double(OCP\IURLGenerator::class,['getBaseUrl'=>fn()=>'https://example.test']),$limiter,$locks);
$row=['id'=>'grant','owner_id'=>'alice','issuer_id'=>'private-token-selector'];
$protection->request('delivery');$protection->resource($row);$protection->token(['owner_id'=>'alice','id'=>'private-token-selector']);
check(count($registered)===4 && $registered[0][3]==='192.0.2.1' && $registered[1][3]==='127.0.0.1','IP and identity quotas registered independently');
check(!str_contains(json_encode($registered),'alice') && !str_contains(json_encode($registered),'private-token-selector'),'Limiter identifiers hide owner/token identity');
$system['ratelimit.protection.enabled']=false;denied(fn()=>$protection->request('delivery'),503,'Disabled native limiter fails closed');$system=[];
$limiter->handlers['registerAnonRequest']=fn()=>throw new class extends RuntimeException implements OCP\Security\RateLimiting\IRateLimitExceededException {};
try {$protection->request('delivery');check(false,'Native quota must reject');} catch (OCA\MediaStorage\Exception\MediaException $error) {check($error->status===429 && $error->headers['Retry-After']==='60','Native quota becomes retryable 429');}
$limiter->handlers['registerAnonRequest']=function(...$args)use(&$registered){$registered[]=$args;};
$settings=['delivery_grant_concurrency'=>'1'];$first=$protection->lease($row);
check(count($held)===3 && strlen(array_key_first($held))===64,'Stream lease occupies native IP/grant/issuer slots using bounded keys');
denied(fn()=>$protection->lease($row),429,'Concurrent grant exhaustion rejects and rolls back other slots');
check(count($held)===3,'Rejected lease releases provisional locks');($first['release'])();($first['release'])();check(!$held && count($released)===4,'Lease cleanup is idempotent');
$system['filelocking.enabled']=false;denied(fn()=>$protection->lease($row),503,'Disabled native locks fail closed');$system=[];
$settings=['delivery_hotlink_protection'=>'1','delivery_allowed_domains'=>'["allowed.test"]'];
foreach (['https://allowed.test/page','https://example.test/path'] as $origin){$requestHeaders=['Referer'=>$origin];$protection->resource($row);check(true,'Allowed referrer accepted');}
foreach (['https://evil.test','null','https://allowed.test@evil.test','https://user@allowed.test'] as $origin){$requestHeaders=['Origin'=>$origin];denied(fn()=>$protection->resource($row),403,'Disallowed or malformed origin rejected');}
$requestHeaders=[];$protection->resource($row);check(true,'Headerless backend access remains supported');
$requestHeaders=['Sec-Fetch-Site'=>'cross-site'];denied(fn()=>$protection->resource($row),403,'Explicit cross-site without origin rejected');
$settings['delivery_allowed_domains']='["bad..host"]';denied(fn()=>$protection->resource($row),503,'Invalid domain policy fails closed');
$settings=[];$requestHeaders=[];
foreach (['normal','error','skipped','expired','destructor'] as $mode) {
    $stream=fopen('php://temp','w+b');fwrite($stream,str_repeat('a',150000));rewind($stream);$chunks=[];$closed=0;
    $response=new BoundedStreamResponse($stream,100000,206,[],function()use(&$closed){++$closed;},hrtime(true)/1e9+($mode==='expired'?-1:60));
    $output=double(OCP\AppFramework\Http\IOutput::class,['getHttpResponseCode'=>fn()=>$mode==='skipped'?304:206,'setOutput'=>function($chunk)use(&$chunks,$mode){if($mode==='error')throw new RuntimeException('Output failed');$chunks[]=$chunk;}]);
    if($mode!=='destructor'){try{$response->callback($output);}catch(RuntimeException $e){check($mode==='error','Output failure propagated safely');}}
    unset($response);check($closed===1 && !is_resource($stream),'Stream and lease released: '.$mode);
    if($mode==='normal')check(strlen(implode('',$chunks))===100000 && max(array_map('strlen',$chunks))<=65536,'Exact byte count with bounded chunks');
    if(in_array($mode,['skipped','expired','destructor'],true))check(!$chunks,'No data emitted when callback skipped or expired');
}
// Exercise the real controller and authorization path with conditionals and byte offsets.
$newMedia=$vfs->create('alice','stream.png',null,42);$grant=$access->issue('alice',$newMedia['id']);$requestHeaders=['Range'=>'bytes=2-5'];$request->handlers['getMethod']=fn()=>'GET';
$delivery=new OCA\MediaStorage\Controller\DeliveryController($request,$access,$protection);
$response=$delivery->read($grant['access']['id'],$grant['key']);$bytes='';
$response->callback(double(OCP\AppFramework\Http\IOutput::class,['getHttpResponseCode'=>fn()=>206,'setOutput'=>function($chunk)use(&$bytes){$bytes.=$chunk;}]));
check($response->getStatus()===206 && $bytes==='xtur' && !$held,'Authorized controller seeks, bounds and releases actual stream');
$requestHeaders=['If-None-Match'=>'*'];$before=$opens;$response=$delivery->read($grant['access']['id'],$grant['key']);check($response->getStatus()===304 && $before===$opens,'Authorized conditional never opens stream');
$access->revoke('alice',$grant['access']['id']);$response=$delivery->read($grant['access']['id'],$grant['key']);$headers=(new ReflectionProperty(OCP\AppFramework\Http\Response::class,'headers'))->getValue($response);
check($response->getStatus()===404 && !isset($headers['ETag'],$headers['Content-Range'],$headers['Accept-Ranges']),'Revocation precedes conditional and metadata disclosure');
echo "PASS: $passed streaming/protection checks.\n";
