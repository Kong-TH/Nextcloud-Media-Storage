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
users = [('ms-test-a-' + nonce, secrets.token_urlsafe(30)), ('ms-test-b-' + nonce, secrets.token_urlsafe(30))]
try:
    for user, password in users:
        provision('POST', '', {'userid': user, 'password': password})
        created.append(user)
    check(True, 'Dedicated non-admin test users created')
    a, at = login(*users[0]); sessions[users[0][0]] = (a, at)
    b, bt = login(*users[1]); sessions[users[1][0]] = (b, bt)
    check(True, 'Non-admin session and management page')
    status, listing = api(a, at, 'GET', '/api/v1/nodes')
    check(status == 200 and isinstance(listing, dict) and 'root_id' in listing, 'Live database root/list query (HTTP ' + str(status) + ')')
    root = listing['root_id']
    status, folder = api(a, at, 'POST', '/api/v1/folders', {'name': 'friends'})
    check(status == 201, 'Create virtual folder (HTTP ' + str(status) + ')')
    folder_id = folder['id']
    status, nested = api(a, at, 'POST', '/api/v1/folders', {'name': 'friend-A', 'parent_id': folder_id})
    check(status == 201, 'Nested folder creation')
    status, _ = api(a, at, 'POST', '/api/v1/folders', {'name': 'friends'})
    check(status == 409, 'Duplicate sibling rejected')
    status, _ = api(a, at, 'PATCH', '/api/v1/nodes/' + folder_id, {'parent_id': nested['id']})
    check(status == 409, 'Circular move rejected')
    status, resolved = api(a, at, 'GET', '/api/v1/resolve?' + urllib.parse.urlencode({'path': '/friends/friend-A'}))
    check(status == 200 and resolved['id'] == nested['id'], 'Virtual path resolution')
    status, renamed = api(a, at, 'PATCH', '/api/v1/nodes/' + nested['id'], {'name': 'renamed', 'parent_id': root})
    check(status == 200 and renamed['id'] == nested['id'], 'Rename/move preserve ID')
    status, searched = api(a, at, 'GET', '/api/v1/nodes?search=renamed')
    check(status == 200 and len(searched['nodes']) == 1, 'Owner search')
    for method, body in [('GET', None), ('PATCH', {'name': 'stolen'}), ('DELETE', None)]:
        status, _ = api(b, bt, method, '/api/v1/nodes/' + folder_id, body)
        check(status == 404, 'Cross-owner ' + method + ' denied')
    status, _ = api(b, bt, 'POST', '/api/v1/folders', {'name': 'bad-parent', 'parent_id': folder_id})
    check(status == 404, 'Cross-owner parent denied')
    status, _, _ = request(a, 'POST', prefix + '/api/v1/folders', b'{"name":"no-csrf"}', {'Content-Type': 'application/json', 'Accept': 'application/json'})
    check(status in (401, 403, 412), 'Missing CSRF token denied')
    anonymous = urllib.request.build_opener()
    status, payload = api(anonymous, '', 'POST', '/api/v1/folders', {'name': 'anonymous'})
    check(status in (401, 403, 412) or payload is None, 'Anonymous mutation denied')
    for name in ['../escape', 'a/b', '..', ' leading']:
        status, _ = api(a, at, 'POST', '/api/v1/folders', {'name': name})
        check(status == 400, 'Invalid/traversal name denied')
    # Each worker owns a separate cookie jar/session so PHP session locks cannot serialize this test.
    workers = [login(*users[0]) for _ in range(4)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        statuses = list(pool.map(lambda client: api(*client, 'POST', '/api/v1/folders', {'name': 'concurrent'})[0], workers))
    check(sorted(statuses) == [201, 409, 409, 409], 'Concurrent duplicate creates: one success')
    status, left = api(a, at, 'POST', '/api/v1/folders', {'name': 'move-left'})
    if status != 201: raise RuntimeError('Concurrent move fixture creation failed')
    status, right = api(a, at, 'POST', '/api/v1/folders', {'name': 'move-right'})
    if status != 201: raise RuntimeError('Concurrent move fixture creation failed')
    moves = [(workers[0], left['id'], right['id']), (workers[1], right['id'], left['id'])]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(lambda item: api(*item[0], 'PATCH', '/api/v1/nodes/' + item[1], {'parent_id': item[2]})[0], moves))
    check(sorted(statuses) == [200, 409], 'Concurrent conflicting moves cannot create a cycle')
    dav = '/remote.php/dav/files/' + urllib.parse.quote(users[0][0]) + '/'
    dav_headers = {'Authorization': basic(*users[0]), 'Content-Type': 'image/png'}
    png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1cAAAAASUVORK5CYII=')
    for name in ['pixel.png', 'replacement.png']:
        status, _, _ = request(admin, 'PUT', dav + name, png, dav_headers)
        check(status == 201, 'DAV test media upload ' + name)
    def file_id(name):
        headers = {'Authorization': basic(*users[0]), 'Content-Type': 'application/xml', 'Depth': '0'}
        status, body, _ = request(admin, 'PROPFIND', dav + name, b'<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><oc:fileid/></d:prop></d:propfind>', headers)
        if status != 207: raise RuntimeError('DAV metadata failed')
        return int(ET.fromstring(body).find('.//{http://owncloud.org/ns}fileid').text)
    first_id, second_id = file_id('pixel.png'), file_id('replacement.png')
    status, media = api(a, at, 'POST', '/api/v1/bindings', {'name': 'pixel.png', 'file_id': first_id, 'parent_id': folder_id})
    check(status == 201, 'Bind actual Nextcloud file (HTTP ' + str(status) + ')')
    status, metadata = api(a, at, 'GET', '/api/v1/nodes/' + media['id'])
    check(status == 200 and metadata['binding_status'] == 'available' and metadata['binding']['mime_type'] == 'image/png', 'Read binding metadata')
    status, _ = api(b, bt, 'POST', '/api/v1/bindings', {'name': 'stolen.png', 'file_id': first_id})
    check(status in (404, 409), 'Cross-user physical file binding denied')
    status, another = api(a, at, 'POST', '/api/v1/bindings', {'name': 'another.png', 'file_id': first_id})
    check(status == 201, 'Multiple virtual references')
    request(admin, 'DELETE', dav + 'pixel.png', headers=dav_headers)
    status, metadata = api(a, at, 'GET', '/api/v1/nodes/' + media['id'])
    check(status == 200 and metadata['binding_status'] == 'needs_rebind', 'Deleted physical file detected')
    status, metadata = api(a, at, 'PATCH', '/api/v1/bindings/' + media['id'], {'file_id': second_id})
    check(status == 200 and metadata['binding_status'] == 'available', 'Explicit rebind recovers file')
    status, _ = api(a, at, 'DELETE', '/api/v1/nodes/' + folder_id)
    check(status == 204, 'Delete virtual subtree')
    status, _, _ = request(admin, 'GET', dav + 'replacement.png', headers=dav_headers)
    check(status == 200, 'Virtual deletion preserves physical file')
    status, _ = api(a, at, 'GET', '/api/v1/nodes/' + media['id'])
    check(status == 404, 'Deleted subtree no longer visible')
    if os.environ.get('MEDIASTORAGE_TEST_PHASE') == '2':
        external_prefix = '/external/v1'
        backend = urllib.request.build_opener()
        def bearer(secret, method, path, value=None):
            headers = {'Accept': 'application/json'}
            if secret is not None: headers['Authorization'] = 'Bearer ' + secret
            body = json.dumps(value).encode() if value is not None else None
            if body is not None: headers['Content-Type'] = 'application/json'
            status, raw, response_headers = request(backend, method, prefix + external_prefix + path, body, headers)
            try: result = json.loads(raw) if raw else None
            except json.JSONDecodeError: result = None
            return status, result, response_headers
        def issue(name, scopes, folder_id=None, lifetime=3600):
            payload = {'name': name, 'scopes': scopes, 'expires_at': int(time.time()) + lifetime}
            if folder_id is not None: payload['folder_id'] = folder_id
            status, result = api(a, at, 'POST', '/api/v1/tokens', payload)
            if status != 201: raise RuntimeError('Issue token failed; deploy app 0.2.0 first. HTTP ' + str(status))
            return result
        read = issue('read-only', ['media:read'])
        status, listing, headers = bearer(read['secret'], 'GET', '/nodes')
        check(status == 200 and 'root_id' in listing, 'Bearer-only request without browser metadata')
        check('no-store' in headers.get('Cache-Control', ''), 'Bearer metadata is not cacheable')
        for secret in [None, 'invalid', read['secret'] + 'x']:
            status, _, _ = bearer(secret, 'GET', '/nodes')
            check(status == 401, 'Missing/malformed credential denied')
        status, _, _ = request(a, 'GET', prefix + external_prefix + '/nodes', headers={'Accept': 'application/json'})
        check(status == 401, 'Session cannot replace external bearer')
        status, _, _ = bearer(read['secret'], 'POST', '/folders', {'name': 'not-allowed'})
        check(status == 403, 'Read token cannot mutate')
        status, listed = api(a, at, 'GET', '/api/v1/tokens')
        check(status == 200 and all('secret' not in row and 'token_hash' not in row for row in listed['tokens']), 'List hides secrets and verifiers')
        entry = next(row for row in listed['tokens'] if row['id'] == read['token']['id'])
        check(entry['last_used_at'] is not None, 'Live last-used timestamp')
        status, _, _ = request(a, 'POST', prefix + '/api/v1/tokens', b'{"name":"bad","scopes":["media:read"],"expires_at":9999999999}', {'Accept': 'application/json', 'Content-Type': 'application/json'})
        check(status in (401, 403, 412), 'Token creation retains CSRF middleware')
        status, _ = api(a, at, 'POST', '/api/v1/tokens', {'name': 'expired', 'scopes': ['media:read'], 'expires_at': int(time.time()) - 1})
        check(status == 400, 'Already-expired token issuance rejected')
        status, area = api(a, at, 'POST', '/api/v1/folders', {'name': 'token-area'})
        if status != 201: raise RuntimeError('Token fixture creation failed')
        status, hidden = api(a, at, 'POST', '/api/v1/folders', {'name': 'outside-token-area'})
        if status != 201: raise RuntimeError('Token fixture creation failed')
        limited = issue('restricted', ['media:read', 'media:manage', 'media:delete'], area['id'])
        status, scoped, _ = bearer(limited['secret'], 'GET', '/nodes')
        check(status == 200 and scoped['root_id'] == area['id'], 'Restricted listing uses virtual boundary')
        status, inside, _ = bearer(limited['secret'], 'POST', '/folders', {'name': 'inside'})
        check(status == 201 and inside['parent_id'] == area['id'], 'Restricted create stays inside boundary')
        status, _, _ = bearer(limited['secret'], 'GET', '/nodes/' + hidden['id'])
        check(status == 403, 'Restricted read outside boundary denied')
        status, _, _ = bearer(limited['secret'], 'PATCH', '/nodes/' + inside['id'], {'parent_id': hidden['id']})
        check(status == 403, 'Restricted move out denied')
        status, _, _ = bearer(limited['secret'], 'PATCH', '/nodes/' + hidden['id'], {'parent_id': area['id']})
        check(status == 403, 'Restricted move in from outside denied')
        status, _, _ = bearer(limited['secret'], 'DELETE', '/nodes/' + area['id'])
        check(status == 403, 'Restriction boundary deletion denied')
        status, _, _ = bearer(limited['secret'], 'POST', '/bindings', {'name': 'guessed.png', 'file_id': second_id})
        check(status == 403, 'Restricted File ID binding denied')
        ownerwide = issue('ownerwide', ['media:read', 'media:manage', 'media:delete'])
        status, bound, _ = bearer(ownerwide['secret'], 'POST', '/bindings', {'name': 'backend.png', 'file_id': second_id, 'parent_id': area['id']})
        check(status == 201, 'Owner-wide bearer binds actual file')
        status, metadata, _ = bearer(limited['secret'], 'GET', '/nodes/' + bound['id'])
        check(status == 200 and metadata['binding_status'] == 'available' and metadata['media']['mime_type'] == 'image/png' and 'binding' not in metadata, 'Scoped metadata hides physical path/context')
        status, _, _ = bearer(limited['secret'], 'GET', '/nodes/' + area['id'])
        check(status == 200, 'Restriction boundary can be read')
        status, _, _ = bearer(ownerwide['secret'], 'DELETE', '/nodes/' + bound['id'])
        check(status == 204, 'Bearer delete scope removes reference')
        status, _, _ = request(admin, 'GET', dav + 'replacement.png', headers=dav_headers)
        check(status == 200, 'Bearer deletion preserves physical data')
        status, rotated = api(a, at, 'POST', '/api/v1/tokens/' + read['token']['id'] + '/rotate', {})
        check(status == 201 and rotated['secret'] != read['secret'], 'Rotation issues one-time replacement')
        check(bearer(read['secret'], 'GET', '/nodes')[0] == 200 and bearer(rotated['secret'], 'GET', '/nodes')[0] == 200, 'Rotation overlap supports backend migration')
        status, _ = api(b, bt, 'DELETE', '/api/v1/tokens/' + read['token']['id'])
        check(status == 404, 'Cross-user token revocation denied')
        status, _ = api(a, at, 'DELETE', '/api/v1/tokens/' + read['token']['id'])
        check(status == 204 and bearer(read['secret'], 'GET', '/nodes')[0] == 401, 'Revocation invalidates old credential')
        short = issue('short-lived', ['media:read'], lifetime=3)
        time.sleep(4)
        check(bearer(short['secret'], 'GET', '/nodes')[0] == 401, 'Expired bearer denied')
        manager = issue('token-manager', ['token:manage'])
        check(bearer(manager['secret'], 'GET', '/tokens')[0] == 200, 'Explicit token management scope')
        check(bearer(read['secret'], 'GET', '/tokens')[0] == 401, 'Revoked token cannot manage credentials')
        check(bearer(ownerwide['secret'], 'GET', '/tokens')[0] == 403, 'Media management does not imply token management')
        check(bearer(manager['secret'], 'DELETE', '/tokens/' + rotated['token']['id'])[0] == 204, 'Token manager can revoke owner credential')
        status, survivor = api(b, bt, 'POST', '/api/v1/folders', {'name': 'must-survive-other-owner-deletion'})
        if status != 201: raise RuntimeError('Lifecycle survivor fixture failed')
        old_uid, old_password = users[0]
        provision('DELETE', '/' + urllib.parse.quote(old_uid)); created.remove(old_uid); sessions.pop(old_uid, None)
        check(bearer(ownerwide['secret'], 'GET', '/nodes')[0] == 401, 'Deleted owner bearer denied')
        provision('POST', '', {'userid': old_uid, 'password': old_password}); created.append(old_uid)
        a, at = login(old_uid, old_password); sessions[old_uid] = (a, at)
        status, fresh = api(a, at, 'GET', '/api/v1/nodes')
        check(status == 200 and fresh['nodes'] == [], 'Recreated user cannot inherit prior virtual nodes')
        status, fresh_tokens = api(a, at, 'GET', '/api/v1/tokens')
        check(status == 200 and fresh_tokens['tokens'] == [], 'Recreated user cannot inherit prior tokens')
        check(bearer(ownerwide['secret'], 'GET', '/nodes')[0] == 401, 'Old credential stays invalid after UID recreation')
        status, _ = api(b, bt, 'GET', '/api/v1/nodes/' + survivor['id'])
        check(status == 200, 'Lifecycle purge preserves other owner')
    print('PASS:', passed, 'live HTTP checks', flush=True)
finally:
    cleanup_errors = []
    for user in reversed(created):
        try:
            if user in sessions:
                client, token = sessions[user]
                status, remaining = api(client, token, 'GET', '/api/v1/nodes')
                if status != 200: raise RuntimeError('Virtual fixture listing failed')
                for node in remaining['nodes']:
                    status, _ = api(client, token, 'DELETE', '/api/v1/nodes/' + node['id'])
                    if status not in (204, 404): raise RuntimeError('Virtual fixture deletion failed')
        except Exception as error:
            cleanup_errors.append(type(error).__name__ + ': virtual cleanup failed')
        try:
            provision('DELETE', '/' + urllib.parse.quote(user))
        except Exception as error:
            cleanup_errors.append(type(error).__name__ + ': user cleanup failed')
    print('Cleaned up test users, physical fixtures and virtual references; owner roots are removed by the lifecycle listener when app 0.2.0 is deployed.', flush=True)
    if cleanup_errors: raise RuntimeError('; '.join(cleanup_errors))
