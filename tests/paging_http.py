#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Installed UI-13 API acceptance with dedicated accounts; no private originals are touched."""
from pathlib import Path
# Share the existing provisioning/session/multipart helpers without running their suite.
source = Path(__file__).with_name('access_http.py').read_text().split('\ntry:\n    for user, password in users:')[0]
exec(compile(source, 'access_http.py helpers', 'exec'))
users = [('ms-paging-a-' + nonce, secrets.token_urlsafe(30)), ('ms-paging-b-' + nonce, secrets.token_urlsafe(30))]

def listing(client, csrf, parent, offset=0, revision=None, sort='name', search='', limit=25):
    values = {'parent_id':parent,'paged':'true','limit':limit,'offset':offset,'sort':sort,'search':search}
    if revision is not None: values['revision'] = revision
    return api(client,csrf,'GET','/api/v1/nodes?'+urllib.parse.urlencode(values))

try:
    for user, password in users:
        provision('POST','',{'userid':user,'password':password});created.append(user)
    a,at=login(*users[0]);b,bt=login(*users[1])
    status,page,_=request(a,'GET',prefix+'/')
    expected_version=json.loads(Path(__file__).resolve().parents[1].joinpath('package.json').read_text())['version']
    check(status==200 and ('data-version="'+expected_version+'"').encode() in page,'Installed version is '+expected_version)
    _,tree=api(a,at,'GET','/api/v1/nodes');root=tree['root_id']
    for size in range(52):
        if size in (0,1,24,25,26,50,51):
            code,data=listing(a,at,root)
            check(code==200 and len(data['nodes'])==min(25,size) and data['total']==size,'Initial 25-object limit and total '+str(size))
            ids=[n['id'] for n in data['nodes']]
            while data['has_more']:
                code,data=listing(a,at,root,data['next_offset'],data['revision'])
                check(code==200 and len(data['nodes'])<=25,'Bounded continuation page')
                ids.extend(n['id'] for n in data['nodes'])
            check(len(ids)==size and len(set(ids))==size,'Exact exhaustion without duplicates '+str(size))
        if size<51:
            code,node=api(a,at,'POST','/api/v1/folders',{'parent_id':root,'name':'Item '+str(size).zfill(3)})
            if code!=201: raise AssertionError('Could not create paging fixture')
    _,first=listing(a,at,root)
    code,nested=api(a,at,'POST','/api/v1/folders',{'parent_id':first['nodes'][0]['id'],'name':'Nested only'})
    check(code==201,'Dedicated nested fixture created')
    check(listing(a,at,root,25,first['revision'])[0]==409,'Concurrent hierarchy change invalidates continuation')
    _,first=listing(a,at,root)
    check(first['total']==51,'Count excludes nested children')
    check(listing(b,bt,root)[0]==404,'Foreign parent/count denied')
    check(listing(a,at,root,25)[0]==400,'Continuation requires revision')
    check(listing(a,at,root,limit=26)[0]==400 and listing(a,at,root,sort='invalid')[0]==400,'Page size and sort validated')
    _,filtered=listing(a,at,root,search='Item 00')
    check(filtered['total']==10 and len(filtered['nodes'])==10,'Current-folder search and count agree')
    png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=')
    code,uploaded,_=upload(a,at,root,'AAA image.png',png)
    check(code==200 and uploaded['state']=='complete','Dedicated image fixture uploaded')
    _,named=listing(a,at,root)
    check(named['nodes'][0]['name']=='AAA image.png','Name sort is global before pagination')
    _,typed=listing(a,at,root,sort='type');typed_ids=[]
    while True:
        typed_ids.extend(n['id'] for n in typed['nodes'])
        if not typed['has_more']: break
        _,typed=listing(a,at,root,typed['next_offset'],typed['revision'],sort='type')
    check(typed_ids[-1]==uploaded['node']['id'] and len(typed_ids)==52,'Global type ordering places image after all folder pages')
    code,legacy=api(a,at,'GET','/api/v1/nodes?'+urllib.parse.urlencode({'parent_id':root,'limit':100}))
    check(code==200 and len(legacy['nodes'])==52 and 'revision' not in legacy,'Legacy listing remains compatible')
    print('PASS:',passed,'installed paging HTTP checks.',flush=True)
finally:
    for user in reversed(created): provision('DELETE','/'+urllib.parse.quote(user))
    print('Dedicated paging accounts and originals removed.',flush=True)
