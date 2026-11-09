#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Run bundled PHP with the installed Snap's base loader for local checks.
# This does not initialize Nextcloud or execute within Snap confinement.
set -eu
snap_root=${MEDIASTORAGE_SNAP_ROOT:-/snap/nextcloud/current}
base_name=$(sed -n 's/^base: //p' "$snap_root/meta/snap.yaml" | head -n 1)
case "$base_name" in core20|core22|core24) ;; *) echo "Unsupported Snap base: $base_name" >&2; exit 2 ;; esac
base_root=/snap/$base_name/current
php_binary=$snap_root/bin/php
# Recent Nextcloud snaps ship a shell wrapper and the ELF binary separately.
if [ -x "$snap_root/bin/php.bin" ]; then php_binary=$snap_root/bin/php.bin; fi
exec "$base_root/lib64/ld-linux-x86-64.so.2" --library-path "$snap_root/lib:$snap_root/usr/lib/x86_64-linux-gnu:$base_root/lib/x86_64-linux-gnu:$base_root/usr/lib/x86_64-linux-gnu" "$php_binary" -n "$@"
