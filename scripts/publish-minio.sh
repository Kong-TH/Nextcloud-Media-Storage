#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Upload one packaged archive and its checksum to MinIO.
# Credentials are read from the environment and are never printed.
set -eu
dist=${1:-dist}
if [ -z "${MINIO_ENDPOINT:-}" ] || [ -z "${MINIO_ACCESS_KEY:-}" ] || [ -z "${MINIO_SECRET_KEY:-}" ] || [ -z "${MINIO_BUCKET:-}" ]; then
    echo 'Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, and MINIO_BUCKET.' >&2
    exit 1
fi
case $MINIO_ENDPOINT in
    http://*|https://*) ;;
    *) echo 'MINIO_ENDPOINT must start with http:// or https://.' >&2; exit 1 ;;
esac
case $MINIO_ENDPOINT in
    *[[:space:]]*) echo 'MINIO_ENDPOINT contains whitespace.' >&2; exit 1 ;;
esac
case $MINIO_BUCKET in
    *[!A-Za-z0-9._-]*) echo 'MINIO_BUCKET contains unsupported characters.' >&2; exit 1 ;;
esac
prefix=${MINIO_PREFIX:-mediastorage}
prefix=${prefix#/}
prefix=${prefix%/}
case $prefix in
    ''|*..*|*[!A-Za-z0-9./_-]*) echo 'MINIO_PREFIX is empty or unsafe.' >&2; exit 1 ;;
esac
command -v python3 >/dev/null 2>&1 || { echo 'python3 is not installed.' >&2; exit 1; }
archive=
count=0
for file in "$dist"/mediastorage-*.tar.gz; do
    if [ ! -f "$file" ]; then
        echo "No archive in ${dist}." >&2
        exit 1
    fi
    count=$((count + 1))
    archive=$file
done
if [ "$count" -ne 1 ]; then
    echo "Expected one archive, found ${count}." >&2
    exit 1
fi
checksum=${archive}.sha256
if [ ! -s "$checksum" ]; then
    echo "Missing checksum ${checksum}." >&2
    exit 1
fi
script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
python3 "$script_dir/s3-put.py" "$archive" "$prefix/$(basename "$archive")"
python3 "$script_dir/s3-put.py" "$checksum" "$prefix/$(basename "$checksum")"
base=${MINIO_ENDPOINT%/}
name=$(basename "$archive")
checksum_name=$(basename "$checksum")
archive_url="${base}/${MINIO_BUCKET}/${prefix}/${name}"
checksum_url="${base}/${MINIO_BUCKET}/${prefix}/${checksum_name}"
printf 'Uploaded %s\n' "$archive_url"
printf 'Checksum %s\n' "$checksum_url"
# GitLab dotenv values are the public object URLs, never credentials.
printf 'ARCHIVE_URL=%s\nCHECKSUM_URL=%s\nARCHIVE_NAME=%s\nCHECKSUM_NAME=%s\n' \
    "$archive_url" "$checksum_url" "$name" "$checksum_name" > minio.env
