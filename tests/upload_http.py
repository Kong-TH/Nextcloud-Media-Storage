#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Live disposable Nextcloud HTTP tests; creates and removes its own test users."""
import base64
import concurrent.futures
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
import xml.etree.ElementTree as ET

if os.environ.get('MEDIASTORAGE_TEST_DISPOSABLE') != 'yes':
    raise SystemExit('Set MEDIASTORAGE_TEST_DISPOSABLE=yes on a disposable test instance.')
credentials = json.loads(Path(os.environ.get('MEDIASTORAGE_TEST_CREDENTIALS', '/tmp/mediastorage-nextcloud-admin.json')).read_text())
base = credentials['url'].rstrip('/')
prefix = '/index.php/apps/mediastorage'
passed = 0
created = []
sessions = {}

class Token(HTMLParser):
    token = None
    def handle_starttag(self, tag, attrs):
        self.token = dict(attrs).get('data-requesttoken') or self.token

def request(opener, method, path, data=None, headers=None):
    req = urllib.request.Request(base + path, data=data, method=method, headers=headers or {})
    try:
        with opener.open(req, timeout=45) as response:
            return response.status, response.read(), response.headers
    except urllib.error.HTTPError as error:
        return error.code, error.read(), error.headers

def check(condition, label):
    global passed
    if not condition:
        raise AssertionError(label)
    passed += 1
    print('PASS:', label, flush=True)

def basic(user, password):
    return 'Basic ' + base64.b64encode((user + ':' + password).encode()).decode()

admin = urllib.request.build_opener()
def provision(method, path, fields=None):
    headers = {'Authorization': basic(credentials['username'], credentials['password']), 'OCS-APIRequest': 'true', 'Accept': 'application/json'}
    body = urllib.parse.urlencode(fields).encode() if fields is not None else None
    if body is not None: headers['Content-Type'] = 'application/x-www-form-urlencoded'
    status, raw, _ = request(admin, method, '/ocs/v1.php/cloud/users' + path + ('&' if '?' in path else '?') + 'format=json', body, headers)
    result = json.loads(raw)
    if status >= 400 or result['ocs']['meta']['status'] != 'ok':
        raise RuntimeError('Test user provisioning failed: HTTP ' + str(status) + ', OCS ' + str(result['ocs']['meta']['statuscode']))
    return result

def login(user, password):
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    status, body, _ = request(opener, 'GET', '/index.php/login')
    parser = Token(); parser.feed(body.decode())
    if not parser.token: raise RuntimeError('Login request token missing')
    payload = urllib.parse.urlencode({'user': user, 'password': password, 'requesttoken': parser.token}).encode()
    status, body, _ = request(opener, 'POST', '/index.php/login', payload, {'Content-Type': 'application/x-www-form-urlencoded', 'Origin': base})
    status, body, _ = request(opener, 'GET', prefix + '/')
    parser = Token(); parser.feed(body.decode())
    if status != 200 or not parser.token or b'Media Storage' not in body:
        raise RuntimeError('Authenticated app page unavailable: HTTP ' + str(status))
    return opener, parser.token

def api(client, token, method, path, value=None):
    headers = {'Accept': 'application/json', 'requesttoken': token}
    body = None
    if value is not None:
        body = json.dumps(value).encode(); headers['Content-Type'] = 'application/json'
    status, raw, _ = request(client, method, prefix + path, body, headers)
    try: result = json.loads(raw) if raw else None
    except json.JSONDecodeError: result = None
    return status, result

nonce = secrets.token_hex(5)
users = [('ms-upload-a-' + nonce, secrets.token_urlsafe(30)), ('ms-upload-b-' + nonce, secrets.token_urlsafe(30))]
def upload(client, token, parent, name, payload, request_id=None, mime='image/png'):
    boundary = 'ms-' + secrets.token_hex(12)
    request_id = request_id or secrets.token_hex(16)
    parts = []
    for key, value in [('parent_id', parent), ('name', name), ('request_id', request_id)]:
        parts.append(('--' + boundary + '\r\nContent-Disposition: form-data; name="' + key + '"\r\n\r\n' + value + '\r\n').encode())
    parts.append(('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="fixture.png"\r\nContent-Type: ' + mime + '\r\n\r\n').encode() + payload + ('\r\n--' + boundary + '--\r\n').encode())
    status, raw, _ = request(client, 'POST', prefix + '/api/v1/uploads', b''.join(parts), {'requesttoken': token, 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Accept': 'application/json'})
    try: result = json.loads(raw)
    except json.JSONDecodeError: result = None
    return status, result, request_id

try:
    for user, password in users:
        provision('POST', '', {'userid': user, 'password': password}); created.append(user)
    a, at = login(*users[0]); b, bt = login(*users[1])
    _, listing = api(a, at, 'GET', '/api/v1/nodes'); root = listing['root_id']
    _, other = api(b, bt, 'GET', '/api/v1/nodes'); other_root = other['root_id']
    status, policy = api(a, at, 'GET', '/api/v1/uploads/policy')
    check(status == 200 and policy['max_bytes'] > 0, 'Live upload policy and worker PHP limits')
    png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=')
    check(upload(a, '', root, 'csrf.png', png)[0] in (401,403,412), 'Upload requires CSRF token')
    check(upload(a, at, other_root, 'foreign.png', png)[0] == 404, 'Upload rejects foreign virtual destination')
    check(upload(a, at, root, 'spoof.png', b'<html>active content</html>')[0] == 415, 'Content detection rejects spoofed image MIME')
    check(upload(a, at, root, 'empty.png', b'')[0] == 400, 'Empty upload rejected')
    status, result, upload_id = upload(a, at, root, 'timeline.png', png)
    check(status == 200 and result['state'] == 'complete', 'Real session multipart upload commits')
    node_id = result['node']['id']
    status, info = api(a, at, 'GET', '/api/v1/nodes/' + node_id)
    path = info['binding']['last_known_path']
    check(status == 200 and info['binding_status'] == 'available', 'Uploaded original bound by actual file ID')
    import re
    check(re.fullmatch(r'/?Media Storage/\d{4}-\d{2}-\d{2}/[a-f0-9]{32}\.png', path) is not None, 'Original stored in daily account folder without hourly subdivision')
    folder = '/' + '/'.join(path.strip('/').split('/')[:-1])
    status, _, headers = request(a, 'GET', '/index.php/apps/files/?' + urllib.parse.urlencode({'dir': folder, 'view': 'files'}))
    check(status == 200 and 'text/html' in headers.get('Content-Type', ''), 'Containing Nextcloud folder opens in Files rather than binary preview')
    dav = '/remote.php/dav/files/' + urllib.parse.quote(users[0][0]) + '/' + '/'.join(urllib.parse.quote(p) for p in path.strip('/').split('/'))
    status, original, _ = request(a, 'GET', dav)
    check(status == 200 and original == png, 'Exact original bytes stored')
    check(upload(a, at, root, 'timeline.png', png, upload_id)[1]['node']['id'] == node_id, 'Retry returns same committed reference')
    check(upload(a, at, root, 'different.png', png, upload_id)[0] == 409, 'Same ID with altered alias rejected')
    check(upload(a, at, root, 'timeline.png', png + b'x', upload_id)[0] == 409, 'Same ID with altered payload rejected')
    check(api(b, bt, 'GET', '/api/v1/uploads/' + upload_id)[1]['state'] == 'not_received', 'Upload status isolated by account')
    check(upload(b, bt, other_root, 'timeline.png', png, upload_id)[0] == 200, 'Accounts may independently use same request ID')
    status, raw, headers = request(a, 'GET', prefix + '/api/v1/nodes/' + node_id + '/preview?size=large')
    check(status == 200 and headers.get('Content-Type','').startswith('image/'), 'Actual Nextcloud image preview service')
    check('no-store' in headers.get('Cache-Control',''), 'Preview retains private no-store policy')
    check(request(b, 'GET', prefix + '/api/v1/nodes/' + node_id + '/preview')[0] == 404, 'Other account cannot load preview')
    status, content, _ = request(a, 'GET', prefix + '/api/v1/nodes/' + node_id + '/content')
    check(status == 200 and content == png, 'Session content bridge resolves original through DAV')
    moved = dav.rsplit('/',1)[0] + '/user-managed.png'
    check(request(a, 'MOVE', dav, headers={'Destination': base + moved, 'Overwrite': 'F', 'requesttoken': at})[0] in (201,204), 'User moves physical original through Nextcloud DAV')
    status, info = api(a, at, 'GET', '/api/v1/nodes/' + node_id)
    check(status == 200 and info['binding_status'] == 'available' and info['binding']['last_known_path'].endswith('user-managed.png'), 'Original move retains file-ID reference')
    check(request(a, 'GET', prefix + '/api/v1/nodes/' + node_id + '/content')[1] == png, 'Content bridge follows user-managed move')
    check(api(a, at, 'DELETE', '/api/v1/nodes/' + node_id)[0] == 204, 'Reference removal succeeds')
    check(request(a, 'GET', moved)[1] == png, 'Reference removal preserves exact original bytes')
    check(upload(a, at, root, 'timeline.png', png, upload_id)[0] == 410, 'Retry after removal does not recreate link or original')
    check(api(a, at, 'GET', '/api/v1/uploads/' + upload_id)[1]['state'] == 'removed', 'Status distinguishes completed then removed reference')
    print('PASS:', passed, 'live upload/preview HTTP checks.', flush=True)
finally:
    for user in reversed(created):
        provision('DELETE', '/' + urllib.parse.quote(user))
    print('Dedicated upload test accounts and their fixtures removed.', flush=True)
