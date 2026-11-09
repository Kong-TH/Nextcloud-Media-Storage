#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Validate shared app version and GitHub event before packaging/releasing."""
import importlib.util
import os
from pathlib import Path
import re


def release_metadata(version, event, ref, default_branch):
    if not re.fullmatch(r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)', version):
        raise ValueError('Release requires a stable MAJOR.MINOR.PATCH version without leading zeroes')
    tag = 'v' + version
    if ref.startswith('refs/tags/') and ref != 'refs/tags/' + tag:
        raise ValueError('Tag must exactly match app/package/lock version: ' + tag)
    if event == 'workflow_dispatch' and ref != 'refs/heads/' + default_branch:
        raise ValueError('Manual release must run from the default branch')
    return {'version': version, 'tag': tag}


def main():
    source = Path(__file__).resolve().with_name('package-release.py')
    spec = importlib.util.spec_from_file_location('package_release', source)
    package = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(package)
    values = release_metadata(package.version(), os.environ['EVENT_NAME'], os.environ['REF'], os.environ['DEFAULT_BRANCH'])
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        for key, value in values.items():
            output.write(key + '=' + value + '\n')
    print('Validated release version:', values['version'])


if __name__ == '__main__':
    main()
