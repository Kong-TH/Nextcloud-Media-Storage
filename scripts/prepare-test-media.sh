#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Generate tiny synthetic video fixtures; never use personal media in acceptance tests.
set -eu
command -v ffmpeg >/dev/null
ffmpeg -hide_banner -loglevel error -f lavfi -i testsrc2=size=160x90:rate=10 -t 2 -c:v libvpx-vp9 -an -y /tmp/mediastorage-ui-video.webm
ffmpeg -hide_banner -loglevel error -f lavfi -i testsrc2=size=160x90:rate=10 -t 2 -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an -y /tmp/mediastorage-ui-video.mp4
