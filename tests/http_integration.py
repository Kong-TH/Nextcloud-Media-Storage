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
    if os.environ.get('MEDIASTORAGE_TEST_PHASE') == '3':
        status, listing = api(a, at, 'GET', '/api/v1/buckets')
        check(status == 200 and listing['buckets'][0]['id'] == root, 'Default Library preserves existing root ID')
        status, bucket = api(a, at, 'POST', '/api/v1/buckets', {'name': 'Brand'})
        check(status == 201 and not bucket['is_default'], 'Create persistent virtual bucket')
        status, _ = api(a, at, 'POST', '/api/v1/buckets', {'name': 'Brand'})
        check(status == 409, 'Duplicate bucket rejected')
        status, _ = api(a, at, 'POST', '/api/v1/buckets', {'name': 'Library'})
        check(status == 409, 'Default Library bucket name reserved')
        status, other_bucket = api(b, bt, 'POST', '/api/v1/buckets', {'name': 'Brand'})
        check(status == 201 and other_bucket['id'] != bucket['id'], 'Bucket names isolated across owners')
        status, listing = api(a, at, 'GET', '/api/v1/buckets')
        check(status == 200 and len(listing['buckets']) == 2, 'Bucket list hides other owners')
        status, _ = api(b, bt, 'POST', '/api/v1/folders', {'name': 'bad', 'parent_id': bucket['id']})
        check(status == 404, 'Cross-owner bucket destination denied')
        for method, value in [('PATCH', {'name': 'bad'}), ('DELETE', None)]:
            status, _ = api(a, at, method, '/api/v1/nodes/' + bucket['id'], value)
            check(status == 403, 'Bucket root protected against node ' + method)
        status, bucket_folder = api(a, at, 'POST', '/api/v1/folders', {'name': 'Images', 'parent_id': bucket['id']})
        check(status == 201, 'Create folder within bucket')
        status, source = api(a, at, 'POST', '/api/v1/bindings', {'name': 'Source.png', 'file_id': second_id, 'parent_id': bucket_folder['id']})
        check(status == 201, 'Link physical file within virtual bucket')
        status, metadata = api(a, at, 'GET', '/api/v1/nodes/' + source['id'])
        check(status == 200 and metadata['virtual_path'] == '/Images/Source.png', 'Bucket paths relative to bucket root')
        status, clone = api(a, at, 'POST', '/api/v1/nodes/' + bucket_folder['id'] + '/copy', {'parent_id': root, 'name': 'Copied images'})
        check(status == 201 and clone['id'] != bucket_folder['id'], 'Transactional copy between buckets')
        status, children = api(a, at, 'GET', '/api/v1/nodes?parent_id=' + clone['id'])
        alias_id = children['nodes'][0]['id']
        status, alias = api(a, at, 'GET', '/api/v1/nodes/' + alias_id)
        check(status == 200 and alias_id != source['id'] and int(alias['binding']['nextcloud_file_id']) == second_id, 'Copied child has fresh ID and same physical target')
        status, _ = api(a, at, 'PATCH', '/api/v1/nodes/' + alias_id, {'name': 'Independent.png'})
        status, original = api(a, at, 'GET', '/api/v1/nodes/' + source['id'])
        check(status == 200 and original['name'] == 'Source.png', 'Copied alias rename leaves original reference unchanged')
        status, _ = api(b, bt, 'POST', '/api/v1/nodes/' + source['id'] + '/copy', {'parent_id': other_bucket['id']})
        check(status == 404, 'Copy source owner boundary enforced')
        status, _ = api(a, at, 'POST', '/api/v1/nodes/' + source['id'] + '/copy', {'parent_id': other_bucket['id']})
        check(status == 404, 'Copy destination owner boundary enforced')
        status, _ = api(a, at, 'DELETE', '/api/v1/nodes/' + clone['id'])
        status, _, _ = request(admin, 'GET', dav + 'replacement.png', headers=dav_headers)
        check(status == 200, 'Removing copied subtree preserves original physical file')
        status, _, _ = request(a, 'POST', prefix + '/api/v1/buckets', b'{"name":"no-csrf"}', {'Content-Type': 'application/json', 'Accept': 'application/json'})
        check(status in (401, 403, 412), 'Bucket creation retains CSRF middleware')
        status, _, _ = request(a, 'POST', prefix + '/api/v1/nodes/' + source['id'] + '/copy', json.dumps({'parent_id': root}).encode(), {'Content-Type': 'application/json', 'Accept': 'application/json'})
        check(status in (401, 403, 412), 'Copy retains CSRF middleware')
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            statuses = list(pool.map(lambda client: api(*client, 'POST', '/api/v1/buckets', {'name': 'Concurrent bucket'})[0], workers))
        check(sorted(statuses) == [201, 409, 409, 409], 'Concurrent duplicate buckets: one success')
        status, editable = api(a, at, 'POST', '/api/v1/buckets', {'name': 'Editable bucket'})
        check(status == 201, 'Create editable bucket')
        status, renamed = api(a, at, 'PATCH', '/api/v1/buckets/' + editable['id'], {'name': 'Renamed bucket'})
        check(status == 200 and renamed['id'] == editable['id'] and renamed['name'] == 'Renamed bucket', 'Rename preserves bucket identity')
        check(api(a, at, 'PATCH', '/api/v1/buckets/' + editable['id'], {'name': 'Brand'})[0] == 409, 'Rename rejects duplicate bucket name')
        check(api(a, at, 'PATCH', '/api/v1/buckets/' + editable['id'], {'name': 'bad/name'})[0] == 400, 'Rename rejects invalid bucket name')
        check(api(b, bt, 'PATCH', '/api/v1/buckets/' + editable['id'], {'name': 'Other'})[0] == 404, 'Rename owner boundary')
        check(api(b, bt, 'POST', '/api/v1/buckets/' + editable['id'] + '/clear')[0] == 404, 'Clear owner boundary')
        for method, suffix in [('PATCH', ''), ('POST', '/clear')]:
            status, _, _ = request(a, method, prefix + '/api/v1/buckets/' + editable['id'] + suffix, b'{"name":"No CSRF"}', {'Content-Type': 'application/json', 'Accept': 'application/json'})
            check(status in (401, 403, 412), 'Bucket management retains CSRF: ' + method)
        status, clear_child = api(a, at, 'POST', '/api/v1/nodes/' + bucket_folder['id'] + '/copy', {'parent_id': editable['id']})
        check(status == 201, 'Populate bucket before clearing')
        check(api(a, at, 'POST', '/api/v1/buckets/' + editable['id'] + '/clear')[0] == 204, 'Clear virtual bucket descendants')
        status, empty = api(a, at, 'GET', '/api/v1/nodes?parent_id=' + editable['id'])
        check(status == 200 and not empty['nodes'], 'Cleared bucket root remains accessible and empty')
        check(api(a, at, 'GET', '/api/v1/nodes/' + clear_child['id'])[0] == 404, 'Cleared child unavailable')
        status, actual, _ = request(admin, 'GET', dav + 'replacement.png', headers=dav_headers)
        check(status == 200 and actual == png and api(a, at, 'GET', '/api/v1/nodes/' + source['id'])[0] == 200, 'Clear preserves original bytes and other links')
        status, renamed_default = api(a, at, 'PATCH', '/api/v1/buckets/' + root, {'name': 'My library'})
        check(status == 200 and renamed_default['id'] == root and renamed_default['is_default'], 'Default rename retains protected identity')
        check(api(a, at, 'DELETE', '/api/v1/buckets/' + root)[0] == 403, 'Renamed default remains undeletable')
        check(api(a, at, 'POST', '/api/v1/buckets', {'name': 'My library'})[0] == 409, 'Default display name participates in uniqueness')
        check(api(a, at, 'PATCH', '/api/v1/buckets/' + root, {'name': 'Library'})[0] == 200, 'Restore default display name')
        check(api(a, at, 'DELETE', '/api/v1/buckets/' + editable['id'])[0] == 204, 'Remove cleared fixture bucket')
        status, retained = api(a, at, 'POST', '/api/v1/nodes/' + source['id'] + '/copy', {'parent_id': root, 'name': 'Retained after bucket removal.png'})
        check(status == 201, 'Create independent reference outside removable bucket')
        status, scoped = api(a, at, 'POST', '/api/v1/tokens', {'name': 'Removed bucket boundary', 'scopes': ['media:read'], 'expires_at': int(time.time()) + 3600, 'folder_id': bucket['id']})
        check(status == 201, 'Issue bucket-scoped credential before removal')
        status, _ = api(a, at, 'DELETE', '/api/v1/buckets/' + root)
        check(status == 403, 'Default Library protected against bucket removal')
        status, _ = api(b, bt, 'DELETE', '/api/v1/buckets/' + bucket['id'])
        check(status == 404, 'Other owner cannot remove bucket')
        status, _ = api(a, at, 'DELETE', '/api/v1/buckets/' + bucket_folder['id'])
        check(status == 404, 'Folder ID cannot be deleted through bucket endpoint')
        status, _, _ = request(a, 'DELETE', prefix + '/api/v1/buckets/' + bucket['id'], headers={'Accept': 'application/json'})
        check(status in (401, 403, 412), 'Bucket removal retains CSRF middleware')
        status, _ = api(a, at, 'DELETE', '/api/v1/buckets/' + bucket['id'])
        check(status == 204, 'Remove populated virtual bucket')
        status, listed_buckets = api(a, at, 'GET', '/api/v1/buckets')
        check(status == 200 and all(row['id'] != bucket['id'] for row in listed_buckets['buckets']), 'Removed bucket is absent from listing')
        for node_id in [bucket['id'], bucket_folder['id'], source['id']]:
            check(api(a, at, 'GET', '/api/v1/nodes/' + node_id)[0] == 404, 'Removed bucket subtree is unavailable')
        status, preserved = api(a, at, 'GET', '/api/v1/nodes/' + retained['id'])
        check(status == 200 and preserved['binding_status'] == 'available', 'Bucket removal preserves references elsewhere')
        status, actual, _ = request(admin, 'GET', dav + 'replacement.png', headers=dav_headers)
        check(status == 200 and actual == png, 'Bucket removal preserves exact original physical bytes')
        status, _, _ = request(urllib.request.build_opener(), 'GET', prefix + '/external/v1/nodes', headers={'Authorization': 'Bearer ' + scoped['secret'], 'Accept': 'application/json'})
        check(status == 404, 'Deleted bucket token boundary fails closed')
        status, _, _ = request(urllib.request.build_opener(), 'GET', prefix + '/external/v1/nodes/' + root, headers={'Authorization': 'Bearer ' + scoped['secret'], 'Accept': 'application/json'})
        check(status == 403, 'Deleted boundary never becomes owner-wide')
        check(api(a, at, 'DELETE', '/api/v1/buckets/' + bucket['id'])[0] == 404, 'Repeated removal reports missing')
        status, recreated = api(a, at, 'POST', '/api/v1/buckets', {'name': 'Brand'})
        check(status == 201 and recreated['id'] != bucket['id'], 'Recreated name uses new boundary identity')
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            removing = pool.submit(api, *workers[0], 'DELETE', '/api/v1/buckets/' + recreated['id'])
            creating = pool.submit(api, *workers[1], 'POST', '/api/v1/folders', {'name': 'Race child', 'parent_id': recreated['id']})
            check(removing.result()[0] == 204 and creating.result()[0] in (201, 404), 'Concurrent create/remove serializes at owner root')
        status, after_race = api(a, at, 'GET', '/api/v1/nodes?search=Race%20child')
        check(status == 200 and not after_race['nodes'], 'Concurrent bucket removal leaves no orphan child')
    if os.environ.get('MEDIASTORAGE_TEST_PHASE') in ('2', '3'):
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
        policy = listed['policy']
        check(60 <= policy['max_lifetime_seconds'] <= 31536000 and abs(policy['server_time'] - time.time()) < 30, 'Token list advertises current bounded server policy')
        status, _ = api(a, at, 'POST', '/api/v1/tokens', {'name': 'Beyond configured lifetime', 'scopes': ['media:read'], 'expires_at': policy['server_time'] + policy['max_lifetime_seconds'] + 3600})
        check(status == 400, 'Issuance rejects expiry beyond advertised lifetime')
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
