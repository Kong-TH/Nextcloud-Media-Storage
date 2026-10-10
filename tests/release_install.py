#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Isolated official-image SQLite archive install, populated upgrade and paired restore.

Requires Docker and MEDIASTORAGE_TEST_DISPOSABLE=yes. Never touches the Snap host.
All generated containers/anonymous volumes and private local fixtures are removed.
"""
import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import secrets
import subprocess
import tarfile
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--archive', type=Path, required=True)
parser.add_argument('--image', default='nextcloud:34-apache')
parser.add_argument('--previous-ref', default='f57a04c')
parser.add_argument('--port', type=int, default=18089)
parser.add_argument('--browser', action='store_true', help='Also use the existing CDP browser and real video fixtures')
parser.add_argument('--proxy-image', default='nginx:stable-alpine')
parser.add_argument('--proxy-port', type=int, default=18090)
args = parser.parse_args()
if os.environ.get('MEDIASTORAGE_TEST_DISPOSABLE') != 'yes':
    raise SystemExit('Set MEDIASTORAGE_TEST_DISPOSABLE=yes for isolated release tests.')
containers = []
passed = 0
password = secrets.token_urlsafe(32)
username = 'release-admin'
base = 'http://127.0.0.1:' + str(args.port)
prefix = '/index.php/apps/mediastorage'
auth = 'Basic ' + base64.b64encode((username + ':' + password).encode()).decode()

def run(*command, input=None):
    result = subprocess.run(command, input=input, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=ROOT)
    if result.returncode:
        # Commands may contain ephemeral passwords; never echo command or output on failure.
        raise RuntimeError('Release fixture command failed: ' + command[0])
    return result.stdout

def check(value, label):
    global passed
    if not value: raise AssertionError(label)
    passed += 1
    print('PASS:', label, flush=True)

def occ(name, *command):
    return run('docker', 'exec', '-u', 'www-data', name, 'php', 'occ', *command)

def http(method, path, value=None, raw=None, headers=None):
    hdr = {'Authorization': auth, 'OCS-APIRequest': 'true', 'Accept': 'application/json'}
    if headers: hdr.update(headers)
    body = json.dumps(value).encode() if value is not None else raw
    if value is not None: hdr['Content-Type'] = 'application/json'
    request = urllib.request.Request(base + path, method=method, data=body, headers=hdr)
    try:
        with urllib.request.urlopen(request, timeout=60) as response: return response.status, response.read(), response.headers
    except urllib.error.HTTPError as error: return error.code, error.read(), error.headers

def api(method, path, value=None):
    code, raw, _ = http(method, prefix + '/api/v1' + path, value)
    try: result = json.loads(raw) if raw else None
    except json.JSONDecodeError: result = None
    return code, result

def start(suffix):
    name = 'mediastorage-release-' + nonce + '-' + suffix
    run('docker', 'run', '-d', '--name', name, '-p', '127.0.0.1:'+str(args.port)+':80', args.image)
    containers.append(name)
    for _ in range(120):
        try:
            if http('GET', '/status.php')[0] == 200:
                run('docker','cp',str(ROOT/'tests/fixtures/release/apache-query-redaction.conf'),name+':/etc/apache2/conf-enabled/zzz-query-redaction.conf')
                run('docker','exec',name,'apache2ctl','configtest')
                run('docker','exec',name,'apache2ctl','graceful')
                return name
        except (OSError, ValueError): pass
        time.sleep(1)
    raise RuntimeError('Isolated Nextcloud startup timed out')

def install(name, archive):
    run('docker', 'cp', str(archive), name+':/tmp/app.tar.gz')
    run('docker', 'exec', name, 'tar', '-xzf', '/tmp/app.tar.gz', '-C', '/var/www/html/custom_apps')
    run('docker', 'exec', name, 'chown', '-R', 'www-data:www-data', '/var/www/html/custom_apps/mediastorage')
    occ(name, 'app:enable', 'mediastorage')

def verify_bytes(name, expected):
    actual = run('docker', 'exec', name, 'sh', '-c', 'cd /var/www/html/custom_apps/mediastorage && sha256sum -c SHA256SUMS')
    check(actual.count(b': OK') == len(expected)-1, 'Every installed archive member matches its manifest')
    for path, data in expected.items():
        actual = run('docker', 'exec', name, 'cat', '/var/www/html/custom_apps/'+path)
        check(hashlib.sha256(actual).digest() == hashlib.sha256(data).digest(), 'Installed member identity: '+path)

nonce = secrets.token_hex(5)
with tempfile.TemporaryDirectory(prefix='mediastorage-release-') as temporary:
    work = Path(temporary)
    try:
        blob = args.archive.resolve().read_bytes()
        checksum = args.archive.with_name(args.archive.name+'.sha256').read_text().split()[0]
        check(hashlib.sha256(blob).hexdigest() == checksum, 'Exact archive checksum')
        with tarfile.open(fileobj=io.BytesIO(blob), mode='r:gz') as tar:
            members = tar.getmembers()
            check(all(m.isfile() and m.name.startswith('mediastorage/') and '..' not in Path(m.name).parts for m in members), 'Archive contains only safe app-root regular files')
            expected = {m.name: tar.extractfile(m).read() for m in members}
        version = ET.fromstring(expected['mediastorage/appinfo/info.xml']).findtext('version')
        check(version == json.loads((ROOT/'package.json').read_text())['version'], 'Archive version matches release source')
        image = json.loads(run('docker', 'image', 'inspect', args.image))[0]
        print('Image identity: '+image['Id'], flush=True)
        old = work/'previous.tar.gz'
        old.write_bytes(run('git', 'archive', '--format=tar.gz', '--prefix=mediastorage/', args.previous_ref, 'appinfo', 'lib', 'templates', 'img', 'composer.json', 'README.md', 'LICENSE'))
        name = start('upgrade')
        occ(name, 'maintenance:install', '--database=sqlite', '--admin-user='+username, '--admin-pass='+password)
        occ(name, 'config:system:set', 'trusted_domains', '1', '--value=127.0.0.1')
        occ(name, 'config:system:set', 'auth.bruteforce.protection.enabled', '--type=boolean', '--value=false')
        install(name, old)
        check(json.loads(occ(name, 'config:list', 'mediastorage'))['apps']['mediastorage']['installed_version'] == '0.2.0', 'Real previous release enabled through Nextcloud migration runner')
        code, listing = api('GET', '/nodes');check(code == 200, 'Previous release root available')
        root = listing['root_id']
        code, folder = api('POST', '/folders', {'name':'Upgrade fixture','parent_id':root});check(code == 201, 'Populated old virtual folder')
        png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=')
        dav = '/remote.php/dav/files/'+username+'/release.png'
        check(http('PUT', dav, raw=png, headers={'Content-Type':'image/png'})[0] == 201, 'Created original before upgrade')
        code, raw, _ = http('PROPFIND', dav, raw=b'<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><oc:fileid/></d:prop></d:propfind>', headers={'Depth':'0','Content-Type':'application/xml'})
        check(code == 207, 'Original file ID available')
        file_id = int(ET.fromstring(raw).find('.//{http://owncloud.org/ns}fileid').text)
        code, node = api('POST', '/bindings', {'name':'release.png','file_id':file_id,'parent_id':folder['id']});check(code == 201, 'Populated previous binding')
        code, token = api('POST', '/tokens', {'name':'Upgrade token','scopes':['media:read'],'expires_at':int(time.time())+3600});check(code == 201, 'Populated previous token')
        occ(name, 'app:disable', 'mediastorage')
        run('docker', 'exec', name, 'rm', '-rf', '/var/www/html/custom_apps/mediastorage')
        install(name, args.archive.resolve())
        check(json.loads(occ(name,'config:list','mediastorage'))['apps']['mediastorage']['installed_version'] == version, 'Exact archive upgraded through real migration runner')
        print('PHP opcache revalidation: '+run('docker','exec',name,'php','-r',"echo ini_get('opcache.validate_timestamps').'/'.ini_get('opcache.revalidate_freq');").decode(),flush=True)
        run('docker','restart',name)
        for _ in range(60):
            try:
                if http('GET','/status.php')[0] == 200: break
            except OSError: pass
            time.sleep(1)
        verify_bytes(name, expected)
        code, metadata = api('GET', '/nodes/'+node['id']);check(code == 200 and metadata['binding_status']=='available', 'Upgrade preserves node and original binding')
        code, rows = api('GET', '/tokens');check(code == 200 and any(t['id']==token['token']['id'] for t in rows['tokens']), 'Upgrade preserves old token')
        code, rows = api('GET', '/buckets');check(code == 200 and len(rows['buckets'])==1, 'Upgrade migrates existing data into Library (HTTP '+str(code)+', count '+str(len((rows or {}).get('buckets',[])))+')')
        code, grant = api('POST', '/nodes/'+node['id']+'/signed-urls', {'ttl_seconds':900});check(code == 201, 'Upgraded database supports temporary delivery')
        capability = grant['url'].removeprefix(base)
        check(http('GET', capability, headers={'Range':'bytes=2-9'})[1] == png[2:10], 'Upgraded archive delivers exact range')
        # Paired snapshot while maintenance mode quiesces HTTP; no background cron is installed.
        occ(name, 'maintenance:mode', '--on')
        run('docker','exec',name,'tar','-czf','/tmp/paired-backup.tar.gz','-C','/var/www/html','config','data','custom_apps')
        backup = work/'paired-backup.tar.gz'
        run('docker','cp',name+':/tmp/paired-backup.tar.gz',str(backup))
        occ(name, 'maintenance:mode', '--off')
        check(api('DELETE','/nodes/'+node['id'])[0] == 204, 'Mutation after backup removes virtual fixture')
        check(http('GET',dav)[1] == png, 'Virtual removal preserves original before restore')
        run('docker','stop',name)
        restored = start('restore')
        occ(restored, 'maintenance:install', '--database=sqlite', '--admin-user='+username, '--admin-pass='+password)
        occ(restored, 'config:system:set', 'trusted_domains', '1', '--value=127.0.0.1')
        install(restored, args.archive.resolve())
        check(api('GET','/nodes')[0] == 200, 'Fresh exact-archive installation supports database root')
        verify_bytes(restored, expected)
        occ(restored,'maintenance:mode','--on')
        run('docker','exec',restored,'rm','-rf','/var/www/html/config','/var/www/html/data','/var/www/html/custom_apps')
        run('docker','cp',str(backup),restored+':/tmp/paired-backup.tar.gz')
        run('docker','exec',restored,'tar','-xzf','/tmp/paired-backup.tar.gz','-C','/var/www/html')
        occ(restored,'maintenance:mode','--off')
        code, metadata = api('GET','/nodes/'+node['id']);check(code == 200 and metadata['binding_status']=='available', 'Fresh-container paired restore recovers deleted node and binding')
        check(http('GET',dav)[1] == png, 'Paired restore preserves exact original bytes')
        check(http('GET',capability)[1] == png, 'Paired restore recovers grant and original consistently')
        verify_bytes(restored, expected)
        # The two independently restored stores must retain old credential authorization.
        code, raw, _ = http('GET',prefix+'/external/v1/nodes',headers={'Authorization':'Bearer '+token['secret']})
        check(code == 200 and folder['id'].encode() in raw, 'Paired restore preserves pre-upgrade token verifier and boundary')
        code, page, _ = http('GET',prefix+'/')
        check(code == 200 and ('data-version="'+version+'"').encode() in page, 'Restored archive serves release version')
        for suffix in ['js/mediastorage-main.js','css/mediastorage.css']:
            code, served, _ = http('GET','/custom_apps/mediastorage/'+suffix)
            check(code == 200 and served == expected['mediastorage/'+suffix], 'HTTP serves exact archive asset: '+suffix)
        # A minimal local HTTP proxy, deliberately separate from production TLS/deployment rules.
        proxy_config = work/'nginx.conf'
        proxy_config.write_text('''events {}
http {
 log_format redacted '$remote_addr $request_method $uri $status $body_bytes_sent';
 access_log /dev/stdout redacted;
 error_log /dev/stderr crit;
 server {
  listen 127.0.0.1:PROXY_PORT;
  location / {
   proxy_pass http://127.0.0.1:UPSTREAM_PORT;
   proxy_set_header Host $http_host;
   proxy_set_header X-Forwarded-For $remote_addr;
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_buffering off;
   proxy_request_buffering off;
   proxy_cache off;
   proxy_read_timeout 30s;
   proxy_send_timeout 30s;
  }
 }
}
'''.replace('PROXY_PORT',str(args.proxy_port)).replace('UPSTREAM_PORT',str(args.port)))
        proxy = 'mediastorage-release-'+nonce+'-proxy'
        run('docker','create','--name',proxy,'--network=host',args.proxy_image)
        containers.append(proxy)
        # Docker copy preserves managed container labels on SELinux hosts.
        run('docker','cp',str(proxy_config),proxy+':/etc/nginx/nginx.conf')
        run('docker','start',proxy)
        direct = base
        base = 'http://127.0.0.1:'+str(args.proxy_port)
        for _ in range(60):
            try:
                if http('GET','/status.php')[0] == 200: break
            except OSError: pass
            time.sleep(.2)
        code, partial, headers = http('GET',capability,headers={'Range':'bytes=2-9'})
        check(code == 206 and partial == png[2:10] and headers.get('Content-Range')=='bytes 2-9/'+str(len(png)), 'Nginx preserves exact partial response')
        check('no-store' in headers.get('Cache-Control','') and not headers.get('Access-Control-Allow-Origin'), 'Proxy retains private cache policy without CORS relaxation')
        tag = headers.get('ETag')
        code, body, headers = http('HEAD',capability)
        check(code == 200 and not body and headers.get('Content-Length')==str(len(png)), 'Nginx preserves HEAD representation length')
        check(http('GET',capability,headers={'If-None-Match':tag})[0] == 304, 'Nginx preserves conditional response')
        check(http('GET',capability,headers={'Range':'bytes=999999-'})[0] == 416, 'Nginx preserves unsatisfiable range')
        check(http('GET',capability,headers={'If-Match':'"wrong"'})[0] == 412, 'Nginx preserves failed precondition')
        check(http('GET',capability+'invalid')[0] == 404, 'Nginx preserves invalid-capability denial')
        base = direct
        print('Runtime: '+occ(restored,'status','--output=json').decode().strip(),flush=True)
        print('PHP: '+run('docker','exec',restored,'php','-r','echo PHP_VERSION;').decode(),flush=True)
        credentials = work/'credentials.json'
        credentials.write_text(json.dumps({'url':base,'username':username,'password':password}));credentials.chmod(0o600)
        environment = dict(os.environ, MEDIASTORAGE_TEST_CREDENTIALS=str(credentials))
        for harness in ['access_http.py','streaming_http.py']:
            result = subprocess.run(['python3',str(ROOT/'tests'/harness)],env=environment,cwd=ROOT)
            check(result.returncode == 0, 'Restored exact archive: '+harness)
        if args.browser:
            result = subprocess.run(['node','tests/frontend/live.mjs'],env=dict(environment,MEDIASTORAGE_TEST_STREAMING_ONLY='yes'),cwd=ROOT)
            check(result.returncode == 0, 'Restored exact archive: anonymous MP4/WebM browser playback and seek')
        # Inspect in memory only: these logs could expose secrets if operator configuration regresses.
        secret = urllib.parse.parse_qs(urllib.parse.urlsplit(capability).query)['key'][0].encode()
        for target in [restored,proxy]:
            logs = run('docker','logs',target)
            check(b'/delivery/v1/' in logs and secret not in logs and token['secret'].encode() not in logs and auth.encode() not in logs, 'Configured access-log redaction: '+('proxy' if target==proxy else 'Apache'))
        print('PASS: '+str(passed)+' isolated release checks; cleanup follows.',flush=True)
    finally:
        failures = 0
        for name in reversed(containers):
            try: run('docker','rm','-f','-v',name)
            except RuntimeError: failures += 1
        if failures: raise RuntimeError('Release container cleanup incomplete; inspect mediastorage-release containers.')
        print('Isolated containers/volumes removed; private backup and credentials discarded.',flush=True)
