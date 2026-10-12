#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Install the pinned MinIO client used by the GitLab publish job.
set -eu
release=RELEASE.2026-09-19T15-24-59Z
dest=${1:-/usr/local/bin/mc}
case $(uname -m) in
    x86_64)
        arch=amd64
        sum=83938eded435e7c28c397ece1dc590b2a79626dd9354aae2107060fec559ae2b
        ;;
    aarch64|arm64)
        arch=arm64
        sum=20f9efeb4fe16bfef022d640a393f77c85b957c08b4c5987ecc42f9f2b98e82b
        ;;
    *)
        echo "Unsupported architecture: $(uname -m)" >&2
        exit 1
        ;;
esac
url="https://dl.min.io/aistor/mc/release/linux-${arch}/archive/mc.${release}"
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
curl -fsSL -A mediastorage-ci -o "$tmp" "$url"
echo "${sum}  ${tmp}" | sha256sum -c -
install -m 0755 "$tmp" "$dest"
"$dest" --version
