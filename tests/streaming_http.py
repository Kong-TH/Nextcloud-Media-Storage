#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Real streaming/policy acceptance. Temporarily changes only snapshotted app settings."""
from pathlib import Path
source = Path(__file__).with_name('access_http.py').read_text().split('\ntry:\n    for user, password in users:')[0]
exec(compile(source, 'access_http.py helpers', 'exec'))
import http.client
import socket
import struct
import hashlib
users = [('ms-stream-a-'+nonce,secrets.token_urlsafe(30)),('ms-stream-b-'+nonce,secrets.token_urlsafe(30))]
settings = {'delivery_hotlink_protection':'0','delivery_allowed_domains':'[]',
            'delivery_grant_concurrency':'1','delivery_ip_concurrency':'2','delivery_issuer_concurrency':'1'}
saved = {}; held = []; recovery = Path('/tmp/mediastorage-stream-settings-'+nonce+'.json')
config_path = '/ocs/v2.php/apps/provisioning_api/api/v1/config/apps/mediastorage'
def config(method, suffix='', value=None):
    headers = {'Authorization':basic(credentials['username'],credentials['password']), 'OCS-APIRequest':'true','Accept':'application/json'}
    body = urllib.parse.urlencode({'value':value}).encode() if value is not None else None
    if body is not None: headers['Content-Type']='application/x-www-form-urlencoded'
    status, raw, _ = request(admin,method,config_path+suffix+'?format=json',body,headers)
    result = json.loads(raw)
    if status >= 400 or result['ocs']['meta']['status'] != 'ok':
        raise RuntimeError('App policy configuration failed: HTTP '+str(status))
    return result['ocs']['data']
def value(data): return data['data']
def issue(client, token, node, issuer=None):
    if issuer:
        code, result = external(issuer,'POST','/nodes/'+node+'/signed-urls',{'ttl_seconds':900})
    else: code, result = api(client,token,'POST','/api/v1/nodes/'+node+'/signed-urls',{'ttl_seconds':900})
    if code != 201: raise AssertionError('Stream grant creation failed')
    return result['url']
def hold(url):
    target=urllib.parse.urlsplit(url)
    if target.scheme+'://'+target.netloc != base: raise AssertionError('Unexpected stream origin')
    cls=http.client.HTTPSConnection if target.scheme=='https' else http.client.HTTPConnection
    connection=cls(target.hostname,target.port,timeout=15);connection.connect()
    connection.sock.setsockopt(socket.SOL_SOCKET,socket.SO_RCVBUF,4096)
    connection.request('GET',target.path+'?'+target.query,headers={'Accept-Encoding':'identity'})
    response=connection.getresponse()
    if response.status != 200: connection.close();raise AssertionError('Holding stream HTTP '+str(response.status))
    held.append((connection,response))
    # A large unread response applies actual TCP backpressure, rather than a fake lease.
    check(int(response.getheader('Content-Length'))>=64*1024*1024,'Holding response exceeds socket/proxy buffers')
    return connection,response
def close_holds():
    while held:
        connection,response=held.pop()
        try:
            if connection.sock: connection.sock.setsockopt(socket.SOL_SOCKET,socket.SO_LINGER,struct.pack('ii',1,0))
            response.close();connection.close()
        except OSError: pass
def recovered(url):
    for _ in range(100):
        code, data, headers=delivery(url,headers={'Range':'bytes=0-31'})
        if code==206: return code,data,headers
        if code!=429: raise AssertionError('Unexpected stream recovery HTTP '+str(code))
        time.sleep(.1)
    raise AssertionError('Stream lease did not recover after client cancellation')
try:
    keys=value(config('GET'))
    for key in settings: saved[key]=value(config('GET','/'+key)) if key in keys else None
    # Recovery file contains only these app policy values, never credentials/capabilities.
    fd=os.open(recovery,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'w') as output: json.dump(saved,output)
    for key,setting in settings.items(): config('POST','/'+key,setting)
    for user,password in users: provision('POST','',{'userid':user,'password':password});created.append(user)
    a,at=login(*users[0]);b,bt=login(*users[1])
    code,page,_=request(a,'GET',prefix+'/')
    expected=json.loads(Path(__file__).resolve().parents[1].joinpath('package.json').read_text())['version']
    check(code==200 and ('data-version="'+expected+'"').encode() in page,'Installed streaming version '+expected)
    png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=')
    block=secrets.token_bytes(1024*1024);payload=png+block*64
    dav='/remote.php/dav/files/'+urllib.parse.quote(users[0][0])+'/stream.png'
    headers={'Authorization':basic(*users[0]),'requesttoken':at,'Content-Type':'image/png'}
    check(request(a,'PUT',dav,payload,headers)[0]==201,'Dedicated 64 MiB physical source created')
    code,raw,_=request(a,'PROPFIND',dav,b'<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><oc:fileid/></d:prop></d:propfind>',headers|{'Depth':'0','Content-Type':'application/xml'})
    if code!=207: raise AssertionError('Dedicated source ID lookup failed')
    file_id=int(ET.fromstring(raw).find('.//{http://owncloud.org/ns}fileid').text)
    _,tree=api(a,at,'GET','/api/v1/nodes')
    code,node=api(a,at,'POST','/api/v1/bindings',{'file_id':file_id,'parent_id':tree['root_id'],'name':'stream.png'})
    check(code==201,'Large source linked with owner authorization')
    url=issue(a,at,node['id']);other=issue(a,at,node['id'])
    code,data,h=delivery(url,headers={'Range':'bytes=1048576-1048703'})
    check(code==206 and data==payload[1048576:1048704] and h.get('Content-Range')=='bytes 1048576-1048703/'+str(len(payload)),'Large-file seek returns exact distant bytes')
    first_headers=delivery(url,'HEAD')[2];other_headers=delivery(other,'HEAD')[2]
    check(first_headers['ETag']!=other_headers['ETag'],'Validators are isolated per grant for the same original')
    check(delivery(other,'HEAD',{'If-None-Match':first_headers['ETag']})[0]==200,'Another grant cannot reuse cached authorization validator')
    hold(url)
    code,_,h=delivery(url,headers={'Range':'bytes=0-31'})
    check(code==429 and h.get('Retry-After')=='1' and 'no-store' in h.get('Cache-Control',''),'Actual parallel grant limit denies second stream')
    code,_,_=delivery(url,'HEAD');check(code==200,'HEAD consumes no stream slot while grant is full')
    validator=delivery(url,'HEAD')[2]['ETag']
    check(delivery(url,headers={'If-None-Match':validator})[0]==304,'Authorized 304 consumes no stream slot')
    hold(other)
    third=issue(a,at,node['id'])
    code,_,h=delivery(third,headers={'Range':'bytes=0-31'})
    check(code==429 and h.get('Retry-After')=='1','Actual per-IP limit spans distinct grants')
    close_holds();check(recovered(url)[1]==png[:32],'Client cancellation releases native stream slots')
    check(recovered(third)[0]==206,'Rejected multi-slot acquisition leaves no provisional locks')
    _,token=api(a,at,'POST','/api/v1/tokens',{'name':'Stream issuer','scopes':['media:read'],'expires_at':int(time.time())+1800})
    derived1=issue(a,at,node['id'],token['secret']);derived2=issue(a,at,node['id'],token['secret'])
    hold(derived1)
    check(delivery(derived2,headers={'Range':'bytes=0-31'})[0]==429,'Actual issuer limit spans separate derived grants')
    close_holds();check(recovered(derived2)[0]==206,'Issuer slots release after client cancellation')
    config('POST','/delivery_hotlink_protection','1');config('POST','/delivery_allowed_domains','["allowed.example"]')
    for hdr in [{'Origin':'https://allowed.example'},{'Referer':'https://allowed.example/page'},{'Origin':base},{}]:
        code,_,h=delivery(third,'HEAD',hdr);check(code==200 and 'no-store' in h.get('Cache-Control',''),'Configured hotlink allows approved origin or backend request')
    for hdr in [{'Origin':'https://denied.example'},{'Origin':'null'},{'Referer':'https://allowed.example@denied.example/'},{'Sec-Fetch-Site':'cross-site'},{'Origin':'https://allowed.example','Referer':'https://denied.example'}]:
        code,_,h=delivery(third,'HEAD',hdr);check(code==403 and 'no-store' in h.get('Cache-Control','') and not h.get('ETag'),'Configured hotlink denies disallowed/malformed browser metadata')
    config('POST','/delivery_allowed_domains','["bad..host"]')
    check(delivery(third,'HEAD')[0]==503,'Invalid configured policy fails closed')
    config('POST','/delivery_hotlink_protection','0')
    check(delivery(third,'HEAD',{'Origin':'https://denied.example'})[0]==200,'Disabled advisory policy permits authorized clients')
    _,other_root=api(b,bt,'GET','/api/v1/nodes')
    _,small,_=upload(b,bt,other_root['root_id'],'isolated.png',png)
    isolated=issue(b,bt,small['node']['id'])
    check(delivery(isolated)[1]==png,'Separate account retains authorized delivery')
    api(a,at,'DELETE','/api/v1/tokens/'+token['token']['id'])
    code,data,h=delivery(derived1,headers={'Range':'bytes=0-31','If-None-Match':'*'})
    check(code==404 and not h.get('ETag') and not h.get('Content-Range') and 'no-store' in h.get('Cache-Control',''),'Revoked issuer denies range/conditional metadata before cache handling')
    code,original,_=request(a,'GET',dav,headers=headers)
    check(code==200 and hashlib.sha256(original).digest()==hashlib.sha256(payload).digest(),'Large original bytes/path preserved through streaming and policy tests')
    print('PASS:',passed,'installed streaming/policy checks.',flush=True)
finally:
    close_holds()
    failures=[]
    for key,setting in saved.items():
        try: config('DELETE' if setting is None else 'POST','/'+key,setting)
        except Exception: failures.append(key)
    for user in reversed(created):
        try: provision('DELETE','/'+urllib.parse.quote(user))
        except Exception: failures.append('fixture account')
    if failures: raise RuntimeError('Cleanup incomplete; recovery file retained: '+str(recovery)+'; items: '+', '.join(failures))
    if recovery.exists(): recovery.unlink()
    print('Original app settings restored; dedicated streaming accounts/originals removed.',flush=True)
