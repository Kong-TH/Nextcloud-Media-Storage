#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""ID-free virtual-path HTTP acceptance; only disposable accounts are used."""
from pathlib import Path
source = Path(__file__).with_name('access_http.py').read_text().split('\ntry:\n    for user, password in users:')[0]
exec(compile(source, 'access_http.py helpers', 'exec'))
users = [('ms-path-a-'+nonce,secrets.token_urlsafe(30)),('ms-path-b-'+nonce,secrets.token_urlsafe(30))]

def token(client, csrf, scopes, boundary=None):
    value={'name':'Path fixture','scopes':scopes,'expires_at':int(time.time())+900}
    if boundary is not None:value['folder_id']=boundary
    code,result=api(client,csrf,'POST','/api/v1/tokens',value)
    if code!=201:raise RuntimeError('Unable to create fixture token')
    return result

def path_read(secret,path,method='GET',headers=None,bucket=None,query=False):
    params={}
    if query:params['key']=secret
    if bucket is not None:params['bucket']=bucket
    suffix='?' + urllib.parse.urlencode(params) if params else ''
    route=('/delivery/v1/' if query else '/external/v1/media/')+urllib.parse.quote(path.lstrip('/'),safe='/')+suffix
    hdr={} if query else {'Authorization':'Bearer '+secret}
    hdr.update(headers or {})
    return request(anonymous,method,prefix+route,headers=hdr)

try:
    for user,password in users:provision('POST','',{'userid':user,'password':password});created.append(user)
    a,at=login(*users[0]);b,bt=login(*users[1])
    code,page,_=request(a,'GET',prefix+'/')
    expected=json.loads(Path(__file__).resolve().parents[1].joinpath('package.json').read_text())['version']
    check(code==200 and ('data-version="'+expected+'"').encode() in page,'Installed path API version '+expected)
    _,tree=api(a,at,'GET','/api/v1/nodes');root=tree['root_id']
    folder_name='10.10.2563 0443 KiTKAT 400'
    code,folder=api(a,at,'POST','/api/v1/folders',{'name':folder_name,'parent_id':root});check(code==201,'Create virtual path fixture')
    png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=')
    code,node,_=upload(a,at,folder['id'],'000013.JPG',png);check(code==200 and node['state']=='complete','Create original/reference fixture');node=node['node']
    owner=token(a,at,['media:read']);scoped=token(a,at,['media:read'],folder['id']);foreign=token(b,bt,['media:read'])
    virtual='/'+folder_name+'/000013.JPG'
    for query in [False,True]:
        code,data,headers=path_read(owner['secret'],virtual,query=query)
        check(code==200 and data==png,'Path returns exact media bytes; query='+str(query))
        check(headers.get('Cache-Control')=='private, no-store' and headers.get('Referrer-Policy')=='no-referrer','Path responses protect cache/referrer')
        code,data,headers=path_read(owner['secret'],virtual,'HEAD',query=query)
        check(code==200 and data==b'' and headers.get('Content-Length')==str(len(png)),'Path HEAD metadata without body')
        etag=headers['ETag']
        code,data,headers=path_read(owner['secret'],virtual,headers={'Range':'bytes=2-9'},query=query)
        check(code==206 and data==png[2:10] and headers.get('Content-Range')==f'bytes 2-9/{len(png)}','Path exact partial range')
        check(path_read(owner['secret'],virtual,headers={'If-None-Match':etag},query=query)[0]==304,'Path conditional read authorizes before 304')
        check(path_read(foreign['secret'],virtual,query=query)[0]==404,'Path cannot read another owner')
        check(path_read(scoped['secret'],'/000013.JPG',query=query)[1]==png,'Path resolves relative to token boundary')
        check(path_read(scoped['secret'],virtual,query=query)[0]==404,'No owner-root fallback for restricted token')
    check(path_read('',virtual)[0]==401,'No header/cookie fallback for external path')
    check(path_read('',virtual,query=True)[0]==404,'No public path access without query credential')
    manage=token(a,at,['media:manage'])
    check(path_read(manage['secret'],virtual,query=True)[0]==403,'Query key requires read scope')
    for invalid in ['../000013.JPG',folder_name+'/../000013.JPG']:
        check(path_read(owner['secret'],invalid)[0] in (400,404),'Traversal or empty-segment path denied')
    code,data,_=path_read(owner['secret'],folder_name+'//000013.JPG')
    check(code in (400,404) or (code==200 and data==png),'Host slash normalization cannot change authorized resource')
    check(external(owner['secret'],'POST','/signed-urls',{'path':folder_name+'//000013.JPG'})[0]==400,'JSON path rejects empty segments before lookup')
    for name in ['ภาพทดสอบ.png','literal%20name.png']:
        code,extra,_=upload(a,at,folder['id'],name,png);check(code==200,'Create Unicode/percent alias')
        check(path_read(scoped['secret'],'/'+name,query=True)[1]==png,'Framework decoding preserves exact virtual name')
    code,bucket=api(a,at,'POST','/api/v1/buckets',{'name':'Named bucket'});check(code==201,'Named bucket fixture')
    code,bucket_node,_=upload(a,at,bucket['id'],'named.png',png);check(code==200,'Bucket reference fixture')
    check(path_read(owner['secret'],'/named.png',bucket='Named bucket',query=True)[1]==png,'Select bucket by name without caller IDs')
    check(path_read(owner['secret'],'/named.png',bucket='Missing',query=True)[0]==404,'Unknown bucket is not fallback')
    check(path_read(scoped['secret'],'/named.png',bucket='Named bucket',query=True)[0]==400,'Restricted key cannot override boundary with bucket')
    code,grant=external(owner['secret'],'POST','/signed-urls',{'path':virtual,'ttl_seconds':60})
    check(code==201 and set(grant)=={'url','expires_at'},'Issue browser link by path with no node ID input/output')
    check(delivery(grant['url'])[1]==png,'Old capability route still serves path-issued browser link')
    api(a,at,'PATCH','/api/v1/nodes/'+node['id'],{'name':'renamed.JPG'})
    check(path_read(owner['secret'],virtual,query=True)[0]==404,'Old virtual path stops resolving after rename')
    new_path='/'+folder_name+'/renamed.JPG'
    check(path_read(owner['secret'],new_path,query=True)[1]==png,'New virtual path follows rename')
    api(a,at,'DELETE','/api/v1/tokens/'+owner['token']['id'])
    check(path_read(owner['secret'],new_path,query=True)[0]==401,'Revoked query credential cannot read media')
    check(delivery(grant['url'])[0]==404,'Revoked issuer denies path-created browser link')
    print('PASS:',passed,'live ID-free path media HTTP checks.')
finally:
    for user in reversed(created):
        try:provision('DELETE','/'+urllib.parse.quote(user))
        except Exception:print('Warning: dedicated fixture account cleanup needs attention')
    print('Dedicated path test accounts and originals removed.')
