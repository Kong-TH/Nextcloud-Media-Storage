#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Run manually as root on the disposable Nextcloud Snap test host.
set -eu
if [ "$(id -u)" -ne 0 ]; then
    echo 'Run with sudo on the disposable test host.' >&2
    exit 2
fi
repo_root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
if [ ! -f "$repo_root/appinfo/info.xml" ]; then
    echo 'Configure the real author and licence using scripts/configure-metadata.php first.' >&2
    exit 2
fi
status=$(/snap/bin/nextcloud.occ status --output=json)
# Check exact initialized status before installing the app.
case "$status" in *'"installed":true'*|*'"installed": true'*) ;; *) echo 'Initialize Nextcloud first.' >&2; exit 2;; esac
app_root=/var/snap/nextcloud/current/nextcloud/extra-apps/mediastorage
if [ -L "$app_root" ]; then echo 'Refusing symlink app destination.' >&2; exit 2; fi
# Disable this app before replacing code, so enable runs its pending migrations.
# Nextcloud app:enable exits early for an already enabled app.
/snap/bin/nextcloud.occ app:disable mediastorage
mkdir -p "$app_root"
for item in appinfo lib img templates composer.json README.md LICENSE; do
    cp -R "$repo_root/$item" "$app_root/"
done
/snap/bin/nextcloud.occ app:enable mediastorage
/snap/bin/nextcloud.occ app:list --enabled
