# Feature test cases and completion evidence

## Required workflow

Every feature needs explicit behavioral test cases before it is considered complete. Record setup/input, expected output, executable coverage or a repeatable manual procedure, and the observed result. Include the normal workflow, relevant failure and permission boundaries, and regressions affected by the change. Use disposable fixtures and generated credentials; never copy production tokens into cases or logs.

Run the applicable cases and record commands, app/server/runtime/database versions, results and limitations in the feature report and current sprint/handoff. An implemented feature with blocked acceptance checks must retain those pending checks. Historical evidence must not be presented as a current deployment result.

For UI work, exercise actual interactions and inspect the rendered result using a connected Playground/browser plugin when available. Include relevant compact layouts, keyboard interactions and loading/error states. Identify whether the test uses fixtures, intercepted candidate assets or an installed package. If no suitable session is connected, mark UI acceptance pending and identify the missing environment. Backend-only changes do not require invented visual results.

## 0.10.0 virtual-path API cases

Setup: disposable Nextcloud 35.0.2 / PHP 8.4.27 / SQLite with two generated owners, a media reference, owner-wide and folder-restricted tokens, and a named bucket. The HTTP suite creates and removes its own fixtures. Counts below group related assertions rather than representing one assertion per case.

| Case | Input/action | Expected behavior | Executable coverage | Observed result |
| --- | --- | --- | --- | --- |
| PATH-01 | Read an encoded virtual path using query key and Authorization header forms | Exact original bytes; private/no-store and no-referrer headers | `tests/path_media_http.py` | Passed |
| PATH-02 | HEAD, byte range and matching ETag requests | Empty HEAD body with length; exact 206 bytes; authorized 304 | `tests/path_media_http.py` | Passed |
| PATH-03 | Missing credential, foreign owner or token without read scope | Denied with endpoint-appropriate 401/404 or 403; no session fallback | `tests/path_media_http.py` | Passed |
| PATH-04 | Folder-restricted relative path; owner-root path; bucket override | Relative path succeeds; no root fallback; bucket override denied | `tests/path_media_http.py` | Passed |
| PATH-05 | Traversal, empty JSON segments, Unicode and literal percent names | Invalid paths denied; names decoded exactly once; host slash normalization never changes the authorized resource | `tests/path_media_http.py`, `tests/path_media.php` | Passed |
| PATH-06 | Exact named bucket and unknown bucket | Named reference succeeds; unknown bucket is 404 | `tests/path_media_http.py` | Passed |
| PATH-07 | Create temporary link using path, then open it | No caller node ID needed; JSON contains only url/expires_at; legacy delivery works | `tests/path_media_http.py` | Passed |
| PATH-08 | Rename media, then revoke issuer token | Old path stops resolving; new path works; revoked token and derived link denied | `tests/path_media_http.py` | Passed |
| PATH-09 | Stream-open failure and movement outside boundary | Lease/stream cleanup and authorization denial | `tests/path_media.php` | Passed |
| PATH-10 | Existing temporary-link lifecycle and streaming | Existing expiry/revocation, ranges and permission behavior retained | `tests/access_http.py` | Passed |

Evidence and reproduction commands: [0.10.0 validation report](../release/0.10.0-path-api.md). Recorded totals are 30 new local checks, 41 path HTTP checks and 76 legacy temporary-access HTTP checks. They establish the isolated target, not the user's remote Snap/MySQL server.

## UI and remaining target checks

This feature changes backend routing/services, not the frontend layout. On 2026-11-11 the document-control plugin reported no connected sessions, so no new Playground visual result is claimed. Existing frontend unit/build checks pass as recorded in the feature report. Remote Snap/MySQL deployment, the new candidate's Nextcloud 34 matrix execution and production proxy behavior remain unverified. Existing manual UI acceptance gates remain open.

Follow-up after the owner authorized tool installation: standalone Chromium 158.0.8127.18/CDP fixture checks passed 444 assertions with 1036 CSRF-backed requests. Compact and desktop screenshots were inspected. This supplies new fixture UI evidence without a connected Playground session; installed-host and remaining manual gates stay open. See the [updated report](../release/0.10.0-path-api.md).

## Library-bound production report — 2026-11-24

Synthetic folder/image inside Library with a Library-bound read token: query and header forms return exact fixture bytes; prefixing Library in the path returns 404; overriding bucket returns 400. Owner-wide token selecting Library also returns the fixture bytes. `tests/path_media_http.py` passed 49 checks on isolated Nextcloud 35.0.3 / PHP 8.4.28 / SQLite; cleanup completed. Production 404 remains unconfirmed and unresolved.

## Bucket-only token creation and complete delivery paths (0.11.0)

| Case | Setup | Expected behavior | Coverage |
| --- | --- | --- | --- |
| Token boundary | Create tokens for Library, another bucket and one of its folders | Owned buckets work. Direct folder issuance is rejected with 409. The UI lists account-wide access and owned buckets | `tests/path_media_http.py`, `tests/tokens.php`, `tests/frontend/browser.mjs` |
| Nested media | Create media in a child folder in Library and another bucket and use their scoped tokens | The complete path returns the exact fixture bytes. An omitted folder fails. A named bucket token cannot read Library | `tests/path_media_http.py` |
| Duplicate filenames | Upload different bytes with the same filename into two folders in Library | Each complete path returns the bytes from its folder. The basename alone returns 404 | `tests/path_media_http.py` |
| Legacy scope | Load a stored folder-bound token and a root-level reference with the same file name | The full path inside the original scope succeeds. The abbreviated path and rotation are rejected. Moving the file outside the scope denies access | `tests/path_media.php`, `tests/tokens.php` |
| Temporary links | Issue a capability from a complete nested path and try the abbreviated path | The full path issues a working URL. The abbreviated path gives 404. Existing capability behavior and revocation still work | `tests/path_media_http.py`, `tests/access_http.py` |

Backend results on isolated Nextcloud 35.0.3 / PHP 8.4.28 / SQLite: 56 path HTTP checks, 130 integration HTTP checks and 76 temporary access HTTP checks passed with the exact 0.11.0 package. The fixture was removed. The token (78), access (64), path (30) and streaming (61) PHP checks passed. Six frontend unit files and 68 package checks passed. Production deployment and production verification are pending.

Run the exact package check with `MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/nextcloud_compatibility.py --port 18118 --source /snap/nextcloud/current/htdocs --archive dist/mediastorage-0.11.0.tar.gz --php 'sh scripts/php-snap.sh' --suite path_media_http --suite http_integration --suite access_http`. The standalone Chromium HTTP fixture (`node tests/frontend/browser.mjs`) passed 445 checks with 1,018 CSRF-backed requests. The compact token boundary dropdown was visually checked and showed only account-wide access and bucket choices.

### Pre-push regression and upgrade rehearsal (2026-11-24)

The 0.11.0 archive passed all seven installed HTTP suites on Nextcloud 35.0.3, PHP 8.4.28 and SQLite. The 372 checks comprise 60 path, 130 integration, 26 upload, 76 access, 19 import, 30 paging and 31 streaming checks. Run the command above with the four additional suite arguments `--suite upload_http --suite imports_http --suite paging_http --suite streaming_http` on an unused port. All ten PHP suites listed in the release workflow, six frontend unit files and 68 archive checks passed.

Populated upgrade procedure (passed on a second isolated instance): install the 0.10.0 archive, create an Album folder and upload a logo with the same name both there and at the bucket root. Issue a folder-bound key and confirm the abbreviated URL returns the image on 0.10.0. Replace the app files with the checksummed candidate, run `occ upgrade` and verify the installed version. On 0.11.0 the existing key returned the original bytes at the complete Album path and 404 at the abbreviated path despite the root duplicate. New folder-bound issuance returned 409 and bucket-bound issuance returned 201. Production Snap/MySQL upgrade and proxy behavior remain unverified.
