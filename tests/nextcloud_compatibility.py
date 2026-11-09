#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Install an exact archive into an isolated source-copy/SQLite Nextcloud fixture.

Never connects to a production instance. Requires an explicit disposable opt-in.
A full Nextcloud distribution and compatible CLI PHP with its modules are required.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
import shlex
import shutil
import signal
import subprocess
import tarfile
import tempfile
import time
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--php', default='php', help='CLI command, e.g. "sh scripts/php-snap.sh"')
    parser.add_argument('--port', type=int, default=18096)
    parser.add_argument('--suite', action='append', choices=['http_integration', 'upload_http', 'access_http', 'streaming_http', 'paging_http', 'imports_http'])
    args = parser.parse_args()
    if os.environ.get('MEDIASTORAGE_TEST_DISPOSABLE') != 'yes':
        parser.error('Set MEDIASTORAGE_TEST_DISPOSABLE=yes; only isolated temporary data is used')
    archive = args.archive.resolve()
    source = args.source.resolve()
    if not (source / 'occ').is_file():
        parser.error('--source must contain a complete Nextcloud distribution')
    if not 1024 <= args.port <= 65535:
        parser.error('Invalid unprivileged port')
    php = shlex.split(args.php)
    base = f'http://127.0.0.1:{args.port}'
    # Refuse an occupied listener instead of accidentally running tests against it.
    import socket
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', args.port))
    with tempfile.TemporaryDirectory(prefix='mediastorage-compat-') as directory:
        work = Path(directory)
        work.chmod(0o700)
        target = work / 'server'
        env = dict(os.environ)
        # Standalone Snap binaries may otherwise search for a non-existent Snap config.
        if 'OPENSSL_CONF' not in env and Path('/etc/ssl/openssl.cnf').is_file():
            env['OPENSSL_CONF'] = '/etc/ssl/openssl.cnf'
        password = secrets.token_urlsafe(32)
        credentials = work / 'credentials.json'
        credentials.write_text(json.dumps({'url': base, 'username': 'compat-admin', 'password': password}))
        credentials.chmod(0o600)

        def occ(*arguments):
            command = php + ['-d', 'memory_limit=512M', str(target / 'occ'), *arguments]
            result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True)
            if result.returncode:
                # Output or arguments can contain the disposable administrator secret.
                raise RuntimeError('Isolated occ command failed: ' + arguments[0])
            return result.stdout

        print('Copying source into isolated fixture', flush=True)
        shutil.copytree(source, target, symlinks=True)
        # Never reuse host config, autoconfig or credentials from the distribution.
        if (target / 'config').is_symlink():
            (target / 'config').unlink()
        else:
            shutil.rmtree(target / 'config')
        (target / 'config').mkdir()
        (target / 'config/CAN_INSTALL').touch()
        checksum = archive.with_name(archive.name + '.sha256').read_text().split()[0]
        if hashlib.sha256(archive.read_bytes()).hexdigest() != checksum:
            raise ValueError('Archive checksum mismatch')
        with tarfile.open(archive, 'r:gz') as tar:
            members = tar.getmembers()
            if not all(m.isfile() and m.name.startswith('mediastorage/') and '..' not in Path(m.name).parts for m in members):
                raise ValueError('Unsafe app archive')
            version = ET.fromstring(tar.extractfile('mediastorage/appinfo/info.xml').read()).findtext('version')
            app = target / 'apps/mediastorage'
            if app.exists():
                shutil.rmtree(app)
            tar.extractall(target / 'apps', filter='data')
        occ('maintenance:install', '--database=sqlite', '--admin-user=compat-admin', '--admin-pass=' + password, '--data-dir=' + str(work / 'data'))
        status = json.loads(occ('status', '--output=json'))
        if not status['installed']:
            raise RuntimeError('Fixture not installed')
        print('Installed Nextcloud ' + status['versionstring'], flush=True)
        print(occ('config:system:set', 'trusted_domains', '1', '--value=127.0.0.1').strip(), flush=True)
        occ('config:system:set', 'auth.bruteforce.protection.enabled', '--type=boolean', '--value=false')
        occ('config:system:set', 'appstoreenabled', '--type=boolean', '--value=false')
        occ('app:enable', 'mediastorage')
        installed = json.loads(occ('config:list', 'mediastorage'))['apps']['mediastorage']['installed_version']
        if installed != version:
            raise RuntimeError('Installed app version mismatch')
        print('Enabled Media Storage ' + version + ' without force', flush=True)
        runtime = subprocess.run(php + ['-r', 'echo PHP_VERSION;'], cwd=ROOT, env=env, capture_output=True, text=True, check=True)
        print('PHP ' + runtime.stdout + '; SQLite; PHP built-in HTTP server (not Snap confinement)', flush=True)
        child_env = dict(env, PHP_CLI_SERVER_WORKERS='6')
        with (work / 'http.log').open('w') as log:
            server = subprocess.Popen(php + ['-d', 'memory_limit=512M', '-S', f'127.0.0.1:{args.port}', '-t', str(target)], cwd=ROOT, env=child_env, stdout=log, stderr=log, start_new_session=True)
            try:
                for _ in range(40):
                    if server.poll() is not None:
                        raise RuntimeError('Isolated server exited')
                    try:
                        with urllib.request.urlopen(base + '/status.php', timeout=2) as response:
                            if json.load(response)['installed']:
                                break
                    except OSError:
                        time.sleep(0.25)
                else:
                    raise RuntimeError('Isolated HTTP startup timed out')
                checks = dict(env, MEDIASTORAGE_TEST_DISPOSABLE='yes', MEDIASTORAGE_TEST_CREDENTIALS=str(credentials), MEDIASTORAGE_TEST_PHASE='3')
                for suite in args.suite or ['http_integration', 'upload_http', 'access_http', 'imports_http']:
                    subprocess.run(['python3', str(ROOT / 'tests' / (suite + '.py'))], cwd=ROOT, env=checks, check=True)
            finally:
                os.killpg(server.pid, signal.SIGTERM)
                server.wait(timeout=10)
        print('PASS: isolated installation and selected HTTP suites; fixture removed on exit', flush=True)


if __name__ == '__main__':
    main()
