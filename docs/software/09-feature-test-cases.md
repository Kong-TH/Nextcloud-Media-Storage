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
