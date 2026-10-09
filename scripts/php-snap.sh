#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Run the bundled PHP CLI with the matching base loader for local unit checks.
# This does not initialize Nextcloud or execute within Snap confinement.
set -eu
snap_root=/snap/nextcloud/current
base_root=/snap/core20/current
exec "$base_root/lib64/ld-linux-x86-64.so.2" --library-path "$snap_root/lib:$snap_root/usr/lib/x86_64-linux-gnu:$base_root/lib/x86_64-linux-gnu:$base_root/usr/lib/x86_64-linux-gnu" "$snap_root/bin/php" -n "$@"
