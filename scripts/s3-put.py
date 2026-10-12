#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Upload one file with a single path-style S3 PutObject request."""
import hashlib
import hmac
import os
import ssl
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, urlsplit


def encode_key(key):
    return '/'.join(quote(part, safe='-_.~') for part in key.split('/'))


def signing_key(secret, datestamp, region):
    def digest(key, value):
        return hmac.new(key, value.encode(), hashlib.sha256).digest()
    key = digest(('AWS4' + secret).encode(), datestamp)
    key = digest(key, region)
    key = digest(key, 's3')
    return digest(key, 'aws4_request')


def authorization(method, path, headers, payload_hash, access_key, secret, region, amzdate):
    datestamp = amzdate[:8]
    signed = sorted(headers)
    canonical_headers = ''.join(name + ':' + headers[name].strip() + '\n' for name in signed)
    canonical = '\n'.join([
        method,
        path,
        '',
        canonical_headers,
        ';'.join(signed),
        payload_hash,
    ])
    scope = datestamp + '/' + region + '/s3/aws4_request'
    string_to_sign = '\n'.join([
        'AWS4-HMAC-SHA256',
        amzdate,
        scope,
        hashlib.sha256(canonical.encode()).hexdigest(),
    ])
    signature = hmac.new(signing_key(secret, datestamp, region), string_to_sign.encode(), hashlib.sha256).hexdigest()
    return 'AWS4-HMAC-SHA256 Credential=' + access_key + '/' + scope + ', SignedHeaders=' + ';'.join(signed) + ', Signature=' + signature


def error_text(body):
    try:
        root = ET.fromstring(body)
    except ET.ParseError:
        return ''
    parts = []
    for name in ('Code', 'Message'):
        element = next((item for item in root.iter() if item.tag.split('}')[-1] == name), None)
        if element is not None and element.text:
            parts.append(element.text.strip())
    return ': '.join(parts)


def put(endpoint, bucket, key, source, access_key, secret, region, insecure):
    parsed = urlsplit(endpoint)
    if parsed.scheme not in ('http', 'https') or not parsed.netloc:
        raise ValueError('MINIO_ENDPOINT must be an http or https URL')
    path = parsed.path.rstrip('/') + '/' + quote(bucket, safe='-_.~') + '/' + encode_key(key)
    data = Path(source).read_bytes()
    payload_hash = hashlib.sha256(data).hexdigest()
    amzdate = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    headers = {
        'content-type': 'application/octet-stream',
        'host': parsed.netloc,
        'x-amz-content-sha256': payload_hash,
        'x-amz-date': amzdate,
    }
    headers['authorization'] = authorization('PUT', path, headers, payload_hash, access_key, secret, region, amzdate)
    request = urllib.request.Request(parsed.scheme + '://' + parsed.netloc + path, data=data, method='PUT')
    for name, value in headers.items():
        request.add_header(name, value)
    context = None
    if insecure:
        context = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(request, context=context, timeout=300) as response:
            response.read()
            return response.status
    except urllib.error.HTTPError as error:
        detail = error_text(error.read())
        message = 'PutObject failed with HTTP ' + str(error.code)
        if detail:
            message += ': ' + detail
        raise RuntimeError(message) from None


def main():
    if len(sys.argv) != 3:
        raise SystemExit('Usage: s3-put.py FILE OBJECT_KEY')
    endpoint = os.environ.get('MINIO_ENDPOINT', '')
    bucket = os.environ.get('MINIO_BUCKET', '')
    access_key = os.environ.get('MINIO_ACCESS_KEY', '')
    secret = os.environ.get('MINIO_SECRET_KEY', '')
    if not all((endpoint, bucket, access_key, secret)):
        raise SystemExit('Set MINIO_ENDPOINT, MINIO_BUCKET, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY.')
    status = put(
        endpoint,
        bucket,
        sys.argv[2],
        sys.argv[1],
        access_key,
        secret,
        os.environ.get('MINIO_REGION', 'us-east-1'),
        os.environ.get('MINIO_INSECURE') == 'true',
    )
    if status not in (200, 204):
        raise SystemExit('PutObject returned HTTP ' + str(status))


if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError, ValueError) as error:
        raise SystemExit(str(error))
