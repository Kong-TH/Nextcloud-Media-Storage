#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Temporary access live HTTP tests; creates and removes only dedicated fixture accounts."""
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
users = [('ms-access-a-' + nonce, secrets.token_urlsafe(30)), ('ms-access-b-' + nonce, secrets.token_urlsafe(30))]
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

anonymous = urllib.request.build_opener()
def delivery(url, method='GET', headers=None):
    target = urllib.parse.urlsplit(url)
    if target.scheme + '://' + target.netloc != base:
        raise RuntimeError('Delivery URL has unexpected origin')
    return request(anonymous, method, target.path + '?' + target.query, headers=headers)

def external(secret, method, path, value=None):
    body = json.dumps(value).encode() if value is not None else None
    status, raw, headers = request(anonymous, method, prefix + '/external/v1' + path, body,
        {'Authorization': 'Bearer ' + secret, 'Content-Type': 'application/json', 'Accept': 'application/json'})
    return status, json.loads(raw) if raw else None

try:
    for user, password in users:
        provision('POST', '', {'userid': user, 'password': password}); created.append(user)
    a, at = login(*users[0]); b, bt = login(*users[1])
    status, page, _ = request(a, 'GET', prefix + '/')
    check(status == 200 and b'data-version="0.6.0"' in page, 'Installed source is 0.6.0 before testing new endpoints')
    _, tree = api(a, at, 'GET', '/api/v1/nodes'); root = tree['root_id']
    _, folder = api(a, at, 'POST', '/api/v1/folders', {'name': 'allowed', 'parent_id': root})
    png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=')
    status, uploaded, _ = upload(a, at, folder['id'], 'alias.png', png)
    check(status == 200 and uploaded['state'] == 'complete', 'Dedicated original uploaded')
    node = uploaded['node']['id']; endpoint = '/api/v1/nodes/' + node + '/signed-urls'
    check(api(a, '', 'POST', endpoint, {'ttl_seconds': 60})[0] in (401,403,412), 'Session issuance requires CSRF')
    check(api(b, bt, 'POST', endpoint, {'ttl_seconds': 60})[0] == 404, 'Cross-owner issuance denied')
    check(api(a, at, 'POST', endpoint, {'ttl_seconds': 0})[0] == 400, 'Zero lifetime rejected')
    check(api(a, at, 'POST', endpoint, {'ttl_seconds': 86401})[0] == 400, 'Excess lifetime rejected')
    status, issued = api(a, at, 'POST', endpoint, {'ttl_seconds': 60})
    check(status == 201 and 'url' in issued and 'key' not in issued, 'Session issues one-time temporary URL')
    gid = issued['access']['id']; url = issued['url']
    status, body, headers = delivery(url)
    check(status == 200 and body == png, 'Anonymous request streams exact original without DAV redirect/login')
    check(headers.get('Content-Type','').startswith('image/png') and 'inline;' in headers.get('Content-Disposition',''), 'Media MIME and inline alias headers')
    check('no-store' in headers.get('Cache-Control','') and headers.get('Referrer-Policy') == 'no-referrer' and headers.get('X-Content-Type-Options') == 'nosniff', 'Public delivery security headers')
    status, body, headers = delivery(url, 'HEAD')
    check(status == 200 and body == b'' and int(headers.get('Content-Length',0)) == len(png), 'HEAD authorizes metadata without body (status=' + str(status) + ', bytes=' + str(len(body)) + ', length=' + str(headers.get('Content-Length')) + ')')
    validator = headers['ETag']; modified_at = headers['Last-Modified']
    for range_value, expected, expected_bytes in [('bytes=0-4',206,png[:5]),('bytes=5-',206,png[5:]),('bytes=-5',206,png[-5:]),('bytes=0-999999999999999999999',206,png),('bytes=999999999999999999999-',416,b''),('bytes=-0',416,b''),('bytes=5-2',416,b''),('bytes=0-1,3-4',416,b''),('items=0-4',200,png),('bytes=bad',200,png)]:
        code, part, range_headers = delivery(url, headers={'Range':range_value})
        check(code == expected and part == expected_bytes and range_headers.get('Accept-Ranges') == 'bytes', 'Streaming range ' + range_value)
        if code == 206: check('Content-Range' in range_headers and int(range_headers['Content-Length']) == len(part), 'Partial representation headers match bytes')
    check(delivery(url,'HEAD',{'Range':'bytes=0-4'})[2].get('Content-Length') == str(len(png)), 'HEAD ignores range and describes full original')
    for conditions, expected in [({'If-None-Match':validator},304),({'If-None-Match':'W/'+validator},304),({'If-Modified-Since':modified_at},304),({'If-Match':'"wrong"'},412),({'If-Match':'W/'+validator},412),({'Range':'bytes=0-4','If-Range':validator},206),({'Range':'bytes=0-4','If-Range':'"wrong"'},200),({'Range':'bytes=0-4','If-Range':modified_at},206)]:
        code, part, conditional_headers = delivery(url,headers=conditions)
        check(code == expected and 'no-store' in conditional_headers.get('Cache-Control',''), 'Authorized conditional status ' + str(expected))
        if code in (304,412): check(part == b'', 'Conditional response has no representation body')
    conditional_status = delivery(url, headers={'If-None-Match':'*'})[0]
    check(conditional_status in (200,304), 'Host conditional handling occurs after successful authorization')
    target = urllib.parse.urlsplit(url)
    check(request(anonymous,'GET',target.path)[0] == 404, 'Missing temporary credential denied')
    modified = target.path + '?key=' + 'x' * 43
    status, rejected, _ = request(anonymous,'GET',modified)
    check(status == 404 and json.loads(rejected)['error'] == 'Temporary access not available.', 'Tampered secret has uniform safe denial')
    status, metadata = api(a, at, 'GET', endpoint)
    check(status == 200 and metadata['access'][0]['id'] == gid and 'url' not in json.dumps(metadata) and 'secret_hash' not in json.dumps(metadata), 'Management metadata never redisplays URL/verifier')
    check(api(b,bt,'GET',endpoint)[0] == 404, 'Cross-owner metadata denied')
    check(api(b,bt,'DELETE','/api/v1/access/'+gid)[0] == 404, 'Cross-owner revoke denied')
    _, quota = api(a,at,'POST',endpoint,{'ttl_seconds':900})
    for attempt in range(120):
        if delivery(quota['url'],'HEAD')[0] != 200: raise AssertionError('Native grant quota rejected too early')
    quota_status, quota_body, quota_headers = delivery(quota['url'],'HEAD')
    check(quota_status == 429 and quota_headers.get('Retry-After') == '60', 'Native grant limiter rejects request 121 with Retry-After')
    check(delivery(url,'HEAD')[0] == 200, 'One exhausted grant does not block a separate authorized grant')
    _, second = api(a,at,'POST',endpoint,{'ttl_seconds':60})
    changed = target._replace(path=urllib.parse.urlsplit(second['url']).path).geturl()
    check(delivery(changed)[0] == 404, 'Selector substitution cannot authorize another grant')
    check(api(a,at,'DELETE','/api/v1/access/'+gid)[0] == 204 and api(a,at,'DELETE','/api/v1/access/'+gid)[0] == 204, 'Revocation is idempotent')
    check(delivery(url)[0] == 404 and delivery(url,'HEAD')[0] == 404, 'Revoked GET/HEAD denied even after prior success')
    check(delivery(url, headers={'If-None-Match':'*'})[0] == 404, 'Conditional request cannot reuse revoked authorization with 304')
    _, token = api(a,at,'POST','/api/v1/tokens',{'name':'Scoped read','scopes':['media:read'],'expires_at':int(time.time())+120,'folder_id':folder['id']})
    check(external('', 'POST', '/nodes/'+node+'/signed-urls',{})[0] == 401, 'External issuance requires explicit bearer')
    status, derived = external(token['secret'],'POST','/nodes/'+node+'/signed-urls',{'ttl_seconds':3600})
    check(status == 201 and derived['access']['expires_at'] <= token['token']['expires_at'], 'Derived grant lifetime is bounded by issuer')
    check(delivery(derived['url'])[1] == png, 'Scoped bearer can authorize anonymous exact-resource read')
    _, outside = api(a,at,'POST','/api/v1/folders',{'name':'outside','parent_id':root})
    check(api(a,at,'PATCH','/api/v1/nodes/'+node,{'parent_id':outside['id']})[0] == 200, 'Session moves reference outside issuer boundary')
    check(delivery(derived['url'])[0] == 404, 'Derived URL rechecks current folder boundary')
    check(external(token['secret'],'POST','/nodes/'+node+'/signed-urls',{})[0] == 403, 'Issuance outside scope denied')
    check(api(a,at,'PATCH','/api/v1/nodes/'+node,{'parent_id':folder['id'],'name':'renamed.png'})[0] == 200, 'Restore scoped reference and change virtual alias')
    check(delivery(derived['url'])[1] == png, 'Exact original remains available when restored to authorized boundary')
    check(api(a,at,'DELETE','/api/v1/tokens/'+token['token']['id'])[0] == 204, 'Issuer token revoked')
    check(delivery(derived['url'])[0] == 404, 'Issuer revocation invalidates temporary URL')
    _, expiring = api(a,at,'POST',endpoint,{'ttl_seconds':1})
    time.sleep(1.1)
    check(delivery(expiring['url'])[0] == 404, 'Temporary URL expires on the live server')
    _, latest = api(a,at,'POST',endpoint,{'ttl_seconds':60})
    _, info = api(a,at,'GET','/api/v1/nodes/'+node)
    dav = '/remote.php/dav/files/' + urllib.parse.quote(users[0][0]) + '/' + '/'.join(urllib.parse.quote(p) for p in info['binding']['last_known_path'].strip('/').split('/'))
    moved = dav.rsplit('/',1)[0] + '/managed.png'
    check(request(a,'MOVE',dav,headers={'Destination':base+moved,'Overwrite':'F','requesttoken':at})[0] in (201,204), 'User moves original through Nextcloud DAV')
    check(delivery(latest['url'])[1] == png, 'Capability follows same-storage physical file-ID move')
    _, replacement, _ = upload(a,at,root,'replacement.png',png)
    _, replacement_info = api(a,at,'GET','/api/v1/nodes/'+replacement['node']['id'])
    original_id = info['binding']['nextcloud_file_id']
    check(api(a,at,'PATCH','/api/v1/bindings/'+node,{'file_id':replacement_info['binding']['nextcloud_file_id']})[0] == 200, 'Session rebinds reference to another owned original')
    check(delivery(latest['url'])[0] == 404, 'Pinned URL never follows a different original after rebind')
    check(api(a,at,'PATCH','/api/v1/bindings/'+node,{'file_id':original_id})[0] == 200, 'Session restores exact original binding')
    check(delivery(latest['url'])[1] == png, 'Restoring exact pinned original retains bounded capability semantics')
    _, changed_content = api(a,at,'POST',endpoint,{'ttl_seconds':60})
    check(request(a,'PUT',moved,data=png+b'fixture-trailer',headers={'Content-Type':'image/png','requesttoken':at})[0] in (201,204), 'User changes original bytes through Nextcloud DAV')
    check(delivery(changed_content['url'])[0] == 404, 'Changed content version invalidates previously issued grant')
    check(request(a,'PUT',moved,data=png,headers={'Content-Type':'image/png','requesttoken':at})[0] in (201,204), 'Restore dedicated original bytes through Nextcloud')
    _, latest = api(a,at,'POST',endpoint,{'ttl_seconds':60})
    check(delivery(latest['url'])[1] == png, 'Fresh content grant works before reference removal')
    check(api(a,at,'DELETE','/api/v1/nodes/'+node)[0] == 204 and delivery(latest['url'])[0] == 404, 'Deleting reference invalidates capability')
    check(request(a,'GET',moved)[1] == png, 'Capability/reference operations preserve original bytes')
    check(api(a,at,'DELETE','/api/v1/access/'+latest['access']['id'])[0] == 204, 'Owner may revoke after reference deletion')
    # Old capability must remain invalid if the UID is reused, even when root identity repeats.
    provision('DELETE','/'+urllib.parse.quote(users[0][0])); created.remove(users[0][0])
    provision('POST','',{'userid':users[0][0],'password':users[0][1]}); created.append(users[0][0])
    fresh, ft = login(*users[0])
    check(api(fresh,ft,'DELETE','/api/v1/access/'+second['access']['id'])[0] == 404 and delivery(second['url'])[0] == 404, 'Owner recreation cannot recover old capability records')
    print('PASS:',passed,'live temporary access HTTP checks.',flush=True)
finally:
    for user in reversed(created):
        provision('DELETE','/'+urllib.parse.quote(user))
    print('Dedicated access accounts and originals removed.',flush=True)
