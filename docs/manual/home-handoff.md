# Home continuation handoff — 2026-11-11

## Snapshot and scope

MinIO alias/path: `myminio/agent-hondoff/nextcloud-media-storage/20261111T085300Z-home-handoff/`. The project pointer is `myminio/agent-hondoff/nextcloud-media-storage/LATEST.json`. Upload verification and pointer publication happen after this document's commit; confirm the pointer and manifest rather than treating this preparation note as upload evidence.

The snapshot includes a portable Git bundle containing local main/dev history, a tracked source snapshot, the exact tested 0.10.0 app archive/checksum, a continuation README, and a SHA-256/size manifest. Optional UI fixture screenshots are identified in the manifest. Browser binaries, node_modules, private keys/certificates, local signing output, production credentials, ignored chat files and Nextcloud config/data are not included.

The release-note fix was committed on dev as 435acdd and fast-forwarded into main. The handoff commit follows the same dev-to-main flow. No Git push is authorized by the handoff request. Remote release bodies v0.9.0 and v0.10.0 were already edited and verified; older releases lacked the removed paragraph. The workflow-template correction still requires Git publication to take effect for future runs. Never recreate tags or replace published release assets to change note text.

## Restore safely

1. Download LATEST.json, then the exact snapshot's MANIFEST.json. Check that project, snapshot prefix and commit match the intended handoff. Download listed files to a new directory, not over existing work. Verify every size/SHA-256 before opening or extracting. The pointer also records the manifest hash.
2. Run `git bundle verify mediastorage.git.bundle` inside a Git repository (or use `git bundle list-heads` before cloning). Clone into a new directory with `git clone -b main mediastorage.git.bundle nextcloud-media-storage`. Restore dev with `git branch dev origin/dev`. Confirm main and dev point to the manifest commit and the working tree is clean.
3. The clone's origin points at the local bundle. Rename it to handoff, then add the actual development remotes only after verifying their URLs: origin is `https://git.kohtnas.com/publicgroup/nextcloud-media-storage.git`; upstream is `https://github.com/Kong-TH/Nextcloud-Media-Storage.git`. Fetch and inspect branch differences before pushing; this bundle does not prove current remote refs.
4. Read AGENTS.md, docs/agent-handoff.md, docs/index.md, the current sprint, docs/manual/path-api.md and docs/release/0.10.0-path-api.md. Install locked frontend dependencies with `npm ci` when needed. No secret is needed to read or restore the source; obtain test credentials separately on an authorized disposable instance.

## Verified baseline and next work

- App 0.10.0 supports direct virtual-path delivery with a query API key, header-authenticated path reads and path-based temporary links. Existing ID APIs and temporary URLs remain compatible; internal IDs are resolved by the app. No app-owned schema change.
- Exact app archive: 190821 bytes, SHA-256 `e9b15fcc87f154877460874ffa45cbdf5a8cd1c8fa45dbddff57de9a5216f56e`. This artifact predates the workflow/document-only changes, so its runtime version remains 0.10.0.
- Isolated Nextcloud 35.0.2 / PHP 8.4.27 / SQLite: all seven HTTP suites pass, 353 checks. Ten PHP suite commands, six frontend test files, 68 archive checks and four release tests pass. Chromium 158 fixture: 444 UI checks / 1036 CSRF-backed requests, with compact and desktop screenshots inspected. See the release report for reproduction and exact limitations.
- Next: try the exact app on the owner's authorized remote Nextcloud 35 Snap/MySQL installation. Check the deployed version before trying the documented URL with a fresh read-only scoped token. Do not reuse or record the previously disclosed test token. Record actual request results without logging credentials.
- Remaining acceptance: candidate on Nextcloud 34, remote Snap/MySQL and installed-host browser checks, production proxy/logging behavior, actual production backup/restore and existing manual UI gates. Local SQLite/fixture results do not close these gates.
- Continue feature work on dev; every feature requires meaningful cases and recorded execution results. Merge to main deliberately after review. Pushing main can invoke automatic release publication; inspect metadata version and remote tags first.
