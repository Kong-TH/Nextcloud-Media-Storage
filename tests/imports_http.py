#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Installed session import acceptance; only dedicated accounts/originals are touched."""
from pathlib import Path
source = Path(__file__).with_name('access_http.py').read_text().split('\ntry:\n    for user, password in users:')[0]
exec(compile(source, 'access_http.py helpers', 'exec'))
import uuid
users = [('ms-import-a-' + nonce, secrets.token_urlsafe(30)), ('ms-import-b-' + nonce, secrets.token_urlsafe(30))]

try:
    for user, password in users:
        provision('POST', '', {'userid':user, 'password':password}); created.append(user)
    a, at = login(*users[0]); b, bt = login(*users[1])
    code, page, _ = request(a, 'GET', prefix + '/')
    expected = json.loads(Path(__file__).resolve().parents[1].joinpath('package.json').read_text())['version']
    check(code == 200 and ('data-version="' + expected + '"').encode() in page, 'Installed version ' + expected)
    _, listing = api(a, at, 'GET', '/api/v1/nodes'); parent = listing['root_id']
    _, other = api(b, bt, 'GET', '/api/v1/nodes'); foreign = other['root_id']
    headers = {'Authorization':basic(*users[0]), 'requesttoken':at}
    dav = '/remote.php/dav/files/' + urllib.parse.quote(users[0][0]) + '/'
    code, raw, _ = request(a, 'MKCOL', dav+'A', headers=headers)
    if code != 201:
        message = ET.fromstring(raw).find('.//{http://sabredav.org/ns}message')
        raise AssertionError('Source setup HTTP ' + str(code) + ': ' + (message.text if message is not None else 'No DAV message'))
    check(True, 'Dedicated source folder created')
    png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=')
    check(request(a, 'PUT', dav+'A/photo.png', png, headers|{'Content-Type':'image/png'})[0] == 201, 'Dedicated physical image created')
    check(request(a, 'PUT', dav+'bad.html', b'<html>unsupported</html>', headers|{'Content-Type':'text/html'})[0] == 201, 'Dedicated unsupported source created')
    def source_id(path):
        code, raw, _ = request(a, 'PROPFIND', dav+path, b'<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><oc:fileid/></d:prop></d:propfind>', headers|{'Depth':'0','Content-Type':'application/xml'})
        if code != 207: raise AssertionError('Source enumeration failed')
        return int(ET.fromstring(raw).find('.//{http://owncloud.org/ns}fileid').text)
    folder_id, image_id, bad_id = source_id('A'), source_id('A/photo.png'), source_id('bad.html')
    identity = str(uuid.uuid4())
    folder_body = {'request_id':identity,'file_id':folder_id,'folder':True,'name':'A','parent_id':parent}
    code, folder = api(a, at, 'POST', '/api/v1/imports/entries', folder_body)
    check(code == 200 and folder['node_type'] == 'folder', 'Folder import verifies source and creates virtual wrapper')
    check(api(a, at, 'POST', '/api/v1/imports/entries', folder_body)[1]['id'] == folder['id'], 'Folder replay keeps identity')
    body = {'request_id':identity,'file_id':image_id,'folder':False,'name':'photo.png','parent_id':folder['id']}
    code, link = api(a, at, 'POST', '/api/v1/imports/entries', body)
    check(code == 200 and link['node_type'] == 'media', 'Image import creates reference')
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        replies = list(pool.map(lambda _:api(a, at, 'POST', '/api/v1/imports/entries', body), range(4)))
    check(all(code == 200 and reply['id'] == link['id'] for code,reply in replies), 'Concurrent retries return one identity')
    _, children = api(a, at, 'GET', '/api/v1/nodes?'+urllib.parse.urlencode({'parent_id':folder['id']}))
    check(len(children['nodes']) == 1, 'Concurrent retries create no duplicates')
    _, detail = api(a, at, 'GET', '/api/v1/nodes/'+link['id'])
    check(detail['virtual_path'] == '/A/photo.png' and detail['binding_status'] == 'available', 'Imported hierarchy and binding resolve')
    check(api(a, at, 'POST', '/api/v1/imports/entries', body|{'name':'changed.png'})[0] == 409, 'Identity cannot change name')
    check(api(a, at, 'POST', '/api/v1/imports/entries', body|{'parent_id':parent})[0] == 409, 'Identity cannot change parent')
    check(api(a, at, 'POST', '/api/v1/imports/entries', body|{'request_id':str(uuid.uuid4())})[0] == 409, 'A new task cannot overwrite a sibling')
    check(api(a, at, 'POST', '/api/v1/imports/entries', body|{'parent_id':foreign})[0] == 404, 'Foreign destination rejected')
    check(api(b, bt, 'POST', '/api/v1/imports/entries', body|{'parent_id':foreign})[0] == 409, 'Foreign source is unavailable')
    check(api(a, at, 'POST', '/api/v1/imports/entries', body|{'request_id':'bad'})[0] == 400, 'Invalid operation identity rejected')
    check(api(a, at, 'POST', '/api/v1/imports/entries', body|{'file_id':bad_id,'name':'bad.html'})[0] == 415, 'Unsupported MIME rejected server-side')
    code, _, _ = request(a, 'POST', prefix+'/api/v1/imports/entries', json.dumps(body).encode(), {'Content-Type':'application/json','requesttoken':'invalid'})
    check(code in (403,412), 'Import enforces session CSRF')
    api(a, at, 'DELETE', '/api/v1/nodes/'+folder['id'])
    code, original, _ = request(a, 'GET', dav+'A/photo.png', headers=headers)
    check(code == 200 and original == png, 'Removing imported metadata preserves original bytes/path')
    print('PASS:', passed, 'installed import HTTP checks.', flush=True)
finally:
    for user in reversed(created): provision('DELETE', '/'+urllib.parse.quote(user))
    print('Dedicated import accounts and originals removed.', flush=True)
