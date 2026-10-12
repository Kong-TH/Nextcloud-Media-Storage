#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Create a GitLab release for the current tag and link the uploaded archive."""
import json
import os
import sys
import urllib.error
import urllib.request
from urllib.parse import quote


def required(name):
    value = os.environ.get(name, '')
    if not value:
        raise SystemExit('Missing ' + name)
    return value


def create_release():
    tag = required('CI_COMMIT_TAG')
    archive_url = required('ARCHIVE_URL')
    checksum_url = required('CHECKSUM_URL')
    archive_name = required('ARCHIVE_NAME')
    checksum_name = required('CHECKSUM_NAME')
    api = required('CI_API_V4_URL').rstrip('/')
    project = required('CI_PROJECT_ID')
    token = required('CI_JOB_TOKEN')
    body = {
        'name': 'Media Storage ' + tag,
        'tag_name': tag,
        'description': 'Unsigned archive ' + archive_name + '.\n\nInstall the mediastorage directory from the archive into the Nextcloud apps directory.',
        'assets': {'links': [
            {'name': archive_name, 'url': archive_url, 'link_type': 'package'},
            {'name': checksum_name, 'url': checksum_url, 'link_type': 'other'},
        ]},
    }
    request = urllib.request.Request(
        api + '/projects/' + quote(project, safe='') + '/releases',
        data=json.dumps(body).encode(),
        method='POST',
    )
    request.add_header('Content-Type', 'application/json')
    request.add_header('JOB-TOKEN', token)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            response.read()
            print('Created GitLab release for ' + tag)
    except urllib.error.HTTPError as error:
        detail = error.read().decode('utf-8', 'replace')
        if error.code == 409:
            print('GitLab release already exists for ' + tag)
            return
        message = 'GitLab release API returned HTTP ' + str(error.code)
        if detail:
            message += ': ' + detail[:500]
        raise SystemExit(message) from None
    project_url = os.environ.get('CI_PROJECT_URL', '').rstrip('/')
    if project_url:
        print(project_url + '/-/releases/' + quote(tag, safe=''))


if __name__ == '__main__':
    try:
        create_release()
    except (OSError, ValueError) as error:
        raise SystemExit(str(error))
