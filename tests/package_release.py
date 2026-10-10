#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Verify the actual release archive and rejection paths without editing source inputs."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tarfile
import tempfile

spec = importlib.util.spec_from_file_location('package_release', Path(__file__).resolve().parents[1] / 'scripts/package-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
passed = 0


def check(condition, label):
    global passed
    if not condition:
        raise AssertionError(label)
    passed += 1


def reject(action, label):
    try:
        action()
    except (ValueError, OSError):
        check(True, label)
    else:
        raise AssertionError(label)


with tempfile.TemporaryDirectory(prefix='mediastorage-package-') as temporary:
    output = Path(temporary)
    archive = release.package(output / 'first')
    second = release.package(output / 'second')
    check(archive.read_bytes() == second.read_bytes(), 'Identical inputs produce identical archives')
    with tarfile.open(archive) as tar:
        members = tar.getmembers()
        names = [m.name for m in members]
        check(all(n.startswith('mediastorage/') and '..' not in n.split('/') for n in names), 'Single safe application root')
        check(all(m.isfile() and m.uid == 0 and m.gid == 0 and m.mtime == 0 and m.mode == 0o644 for m in members), 'Normalized regular files only')
        check(not any(any(part in n.split('/') for part in ['.git', '.agents', 'node_modules', 'tests', '.chat', 'src']) or n.endswith(('.map','.local')) for n in names), 'Development/private files excluded')
        check(all('mediastorage/' + p in names for p in ['appinfo/info.xml','appinfo/routes.php','lib/AppInfo/Application.php','templates/index.php',*release.ASSETS]), 'Required runtime inputs included')
        manifest = tar.extractfile('mediastorage/SHA256SUMS').read().decode().splitlines()
        check(len(manifest) == len(members) - 1, 'Manifest covers every other file')
        for line in manifest:
            expected, path = line.split('  ', 1)
            check(hashlib.sha256(tar.extractfile('mediastorage/' + path).read()).hexdigest() == expected, 'Packaged digest matches actual bytes')
    check((archive.parent / (archive.name + '.sha256')).read_text().split()[0] == hashlib.sha256(archive.read_bytes()).hexdigest(), 'External archive checksum matches')
    original_read = release.read
    for mode in ['version','source','asset']:
        def changed_read(path, mode=mode):
            data = original_read(path)
            if mode == 'version' and path == 'package.json':
                value=json.loads(data);value['version']='999.0.0';return json.dumps(value).encode()
            if mode == 'source' and path == 'src/main.js': return data + b'\n// stale fingerprint\n'
            if mode == 'asset' and path == release.ASSETS[0]: return data + b'\n// changed output\n'
            return data
        release.read = changed_read
        reject(lambda:release.package(output / 'rejected'), mode + ' mismatch rejected')
        check(not (output / 'rejected').exists(), 'Mismatch rejected before creating output')
    release.read = original_read
    original_root = release.ROOT
    fixture = output / 'fixture';fixture.mkdir();(fixture / 'file').write_text('fixture');(fixture / 'link').symlink_to(fixture / 'file')
    release.ROOT = fixture
    reject(lambda:release.read('link'), 'Symlink rejected')
    (fixture / 'directory-link').symlink_to(fixture, target_is_directory=True)
    reject(lambda:release.tree('.'), 'Directory symlink rejected')
    release.ROOT = original_root
print('PASS:', passed, 'release archive checks.')
