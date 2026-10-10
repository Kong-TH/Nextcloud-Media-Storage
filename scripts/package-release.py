#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Build an unsigned, deterministic Nextcloud application archive from explicit inputs."""
import argparse
import gzip
import hashlib
import io
import json
from pathlib import Path
import re
import tarfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ['js/mediastorage-main.js', 'css/mediastorage.css', 'js/THIRD-PARTY-NOTICES.txt']


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read(path):
    # Reject symlinks in both the file itself and every parent inside the project.
    target = ROOT / path
    for part in [target, *target.parents]:
        if part == ROOT:
            break
        if part.is_symlink():
            raise ValueError('Symlink input rejected: ' + path)
    return target.read_bytes()


def tree(directory):
    paths = []
    for path in (ROOT / directory).rglob('*'):
        if path.is_symlink():
            raise ValueError('Symlink input rejected: ' + path.relative_to(ROOT).as_posix())
        if path.is_file():
            paths.append(path.relative_to(ROOT).as_posix())
    return paths


def source_fingerprint():
    paths = ['package.json', 'package-lock.json', 'vite.config.js', 'scripts/prepare-frontend.mjs', 'scripts/package-release.py']
    paths += tree('src')
    paths += tree('img')
    value = hashlib.sha256()
    for path in sorted(paths):
        value.update(path.encode() + b'\0' + bytes.fromhex(digest(read(path))))
    return value.hexdigest()


def version():
    metadata = ET.fromstring(read('appinfo/info.xml'))
    release = metadata.findtext('version')
    if metadata.findtext('id') != 'mediastorage' or not re.fullmatch(r'\d+\.\d+\.\d+', release or ''):
        raise ValueError('Invalid app identity/version')
    package = json.loads(read('package.json'))
    lock = json.loads(read('package-lock.json'))
    if {package['version'], lock['version'], lock['packages']['']['version']} != {release}:
        raise ValueError('App/package/lock versions differ')
    return release


def record_build():
    info = {'version': version(), 'source_sha256': source_fingerprint(), 'assets': {p: digest(read(p)) for p in ASSETS}}
    (ROOT / 'js/build-info.json').write_text(json.dumps(info, sort_keys=True, indent=2) + '\n')


def package(output):
    release = version()
    info = json.loads(read('js/build-info.json'))
    if info.get('version') != release or info.get('source_sha256') != source_fingerprint():
        raise ValueError('Missing or stale frontend build; run npm run build')
    for path in ASSETS:
        if info.get('assets', {}).get(path) != digest(read(path)):
            raise ValueError('Built asset hash differs: ' + path)
    paths = ['composer.json', 'README.md', 'LICENSE', 'appinfo/info.xml', 'appinfo/routes.php', 'js/build-info.json', *ASSETS]
    for directory in ['lib', 'templates']:
        paths += [path for path in tree(directory) if path.endswith('.php')]
    paths += ['img/app.svg', 'img/material-symbols-outlined.ttf', 'img/material-symbols-NOTICE.txt', 'img/material-symbols-LICENSE.txt']
    contents = {path: read(path) for path in sorted(set(paths))}
    contents['SHA256SUMS'] = ''.join(digest(data) + '  ' + path + '\n' for path, data in contents.items()).encode()
    output.mkdir(parents=True, exist_ok=True)
    archive = output / ('mediastorage-' + release + '.tar.gz')
    temporary = output / (archive.name + '.tmp')
    try:
        with temporary.open('wb') as raw:
            with gzip.GzipFile(filename='', mode='wb', fileobj=raw, mtime=0) as compressed:
                with tarfile.open(fileobj=compressed, mode='w', format=tarfile.PAX_FORMAT) as tar:
                    for path, data in sorted(contents.items()):
                        member = tarfile.TarInfo('mediastorage/' + path)
                        member.size = len(data)
                        member.mode = 0o644
                        tar.addfile(member, io.BytesIO(data))
        temporary.replace(archive)
    finally:
        temporary.unlink(missing_ok=True)
    (output / (archive.name + '.sha256')).write_text(digest(archive.read_bytes()) + '  ' + archive.name + '\n')
    print('Prepared unsigned archive:', archive)
    print('Packaged files:', len(contents))
    return archive


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--record-build', action='store_true', help='Called after frontend assets/notices are built')
    parser.add_argument('--output', type=Path, default=ROOT / 'dist')
    args = parser.parse_args()
    try:
        record_build() if args.record_build else package(args.output)
    except (ValueError, OSError, KeyError, ET.ParseError) as error:
        parser.exit(1, 'Packaging failed: ' + str(error) + '\n')
