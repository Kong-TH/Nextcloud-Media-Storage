# Test Instructions

## Executed checks

```bash
sh scripts/php-snap.sh tests/run.php
sh scripts/php-snap.sh tests/schema.php
```

On 2026-10-09, PHP 8.4.26 from Snap revision 54326 passed 69 service/controller checks. Strict doubles implement installed Nextcloud 34 public interfaces. They cover validation, hierarchy, duplicates, cycles, depth, owner isolation, missing/ambiguous/changed storage bindings, explicit recovery, reference-only deletion, session-derived owner and security attributes. Attribute checks do not replace live middleware tests.

Schema checks invoke the actual migration with a schema-wrapper double and bundled Doctrine schema objects; install generated SQL into in-memory SQLite; check sibling uniqueness, independent owner roots, exact-case name keys and rollback. Migration re-entry is checked. MySQL/PostgreSQL SQL generation is checked, not execution. App metadata template is schema-validated in memory with fixture identity values; no project author/licence is inferred.

## Live integration test — not yet executed

Use a disposable initialized Nextcloud 34 instance, enable this app using its real metadata, and create a dedicated test user. Invoke `tests/integration.php` with the same PHP runtime/configuration and filesystem access used by that Nextcloud installation:

```bash
MEDIASTORAGE_TEST_DISPOSABLE=yes \
NEXTCLOUD_SOURCE=/path/to/nextcloud \
MEDIASTORAGE_TEST_USER=dedicated-test-user \
php /path/to/mediastorage/tests/integration.php
```

For Snap, the bare host PHP or direct bundled binary is insufficient for live bootstrap. Run inside the Snap PHP environment or use a standard disposable Nextcloud development environment. The local `php-snap.sh` helper alone is for unit/schema checks; it does not supply Snap service environment/configuration or root access.

The integration test creates uniquely named physical and virtual fixtures, exercises the actual app persistence and Filesystem APIs, checks duplicate/cycle rejection, deletes its own physical fixture to simulate a missing binding, explicitly rebinds, and verifies virtual deletion preserves the replacement. Finally it deletes only its own fixture directory. The logical owner root remains as normal app metadata.

Remaining required evidence: actual app enablement/migration runner install and upgrade, HTTP session/CSRF enforcement, parallel conflicting mutations, cross-owner/shared-mount permissions, and each claimed database provider. Tokens and delivery tests belong to later phases.

## Live HTTP suite — executed

```bash
MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/http_integration.py
```

This stdlib Python suite reads the test admin credential file `/tmp/mediastorage-nextcloud-admin.json` (or `MEDIASTORAGE_TEST_CREDENTIALS`), without printing credentials. It creates two unique disposable non-admin users using the provisioning API, logs in through the real session flow with Origin/CSRF checks, and calls the installed app. It does not require root. Localhost requests may require the Codex command approval to run outside the sandbox.

**2026-10-09: 33 checks passed**, including live hierarchy operations, owner isolation, middleware enforcement, concurrent duplicates/cycle prevention with independent sessions, DAV uploads/file IDs, bindings, missing-file recovery and physical-file preservation. Actual backend: Snap MySQL; exact database version not independently queried. Fresh app installation passed; prior-version migration upgrade did not run.

Cleanup removes this run's virtual references and users/physical fixtures. Empty app-owned roots may remain. Initial exploratory runs removed accounts before virtual cleanup and may have retained app metadata. No app user-deletion listener exists yet; implement lifecycle cleanup before release, including user-ID recreation isolation tests. The separate PHP CLI harness above remains unexecuted.

## Phase 2 checks and prepared live suite

```bash
sh scripts/php-snap.sh tests/tokens.php
sh scripts/php-snap.sh tests/schema.php
```

61 new local checks passed using strict public-interface doubles: token entropy/format/verifier secrecy, invalid/expired/revoked/disabled/deleted authentication, explicit scope boundaries, folder containment/source/destination, File ID restrictions, rotation overlap, one-time secret/listing redaction, lifecycle registration/delegation, session CSRF attributes and configured response headers. SQLite schema checks execute a populated 0.1-to-0.2 upgrade. Response-header unit checks inspect configured headers directly; actual Nextcloud header merging is a live test.

After deployment of 0.2.0:

```bash
MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=2 python3 tests/http_integration.py
```

The opt-in suite adds actual token issuance/read/revocation/rotation, raw bearer requests without browser metadata, missing/invalid/expired credentials, scope/folder/File ID boundaries, real owner-wide file bindings, no-store headers, token last use and deletion/recreation isolation. It deletes/recreates only its own random fixture UID and checks another test owner survives. Neither test passwords nor API secrets are printed. This extended suite ran successfully against 0.2.0: 70 HTTP checks passed, exit 0.

## Executed 0.2.0 acceptance result

Following the user's successful 0.1-to-0.2 deployment, ran the opt-in Phase 2 command above: **70 live HTTP checks passed**. Combined lifecycle checks verified that deleting/recreating the same fixture UID cannot recover old virtual nodes or token metadata and that old credentials stay invalid; another test owner survived. The suite exercised the actual token table/middleware and Filesystem API through HTTP. It did not directly inspect SQL rows after deletion or instrument all in-flight deletion races. Test users/references/physical fixtures were cleaned up.

The initial PHP CLI integration harness remains unexecuted; live evidence comes from the Python HTTP suite. Other database deployments remain unverified.


## Standalone UI design study

These checks exercise only docs/design/prototype sample data, without a Nextcloud session or server mutation. From the repository root:

```sh
node tests/design/reference-model.cjs
```

For the browser study, start an isolated Chrome profile with headless mode and local DevTools port 9322, then run `node tests/design/browser-checks.mjs`. Use a dedicated profile/port because the script navigates the first page in that DevTools session to the local prototype. `MEDIASTORAGE_DESIGN_CDP_URL` can override the localhost endpoint. No npm dependencies are required; Node 24 and Chrome 154 were used. The script writes screenshots/results under /tmp and checks the sample reference actions, FAB, toolbar, tooltips, keyboard and responsive geometry. Close the dedicated browser afterward. Sandbox permissions may be required for launching Chrome and local DevTools access.

See [design validation](../docs/design/validation.md) for recorded results and untested production behavior. These tests do not replace backend tests or actual Nextcloud UI/accessibility verification.


The design browser suite also measures bottom contextual-toolbar containment, unchanged list viewport/first-row position on selection, selected-count placement after the object count, short-height last-row clearance and reduced-motion entry behavior. It writes compact toolbar snapshots to `/tmp/mediastorage-toolbar-390.png` and `/tmp/mediastorage-toolbar-320.png` for visual review; these checks do not establish actual Nextcloud or assistive-technology integration.


Action tests verify FAB/toolbar mutual exclusion at every width, including clipboard-only context and resize/RTL. X restores Add and clears selection/clipboard before either Add task can open. Final-row focus/scroll, toolbar overflow and tooltip ownership remain covered. Geometry waits for actual toolbar animation completion; cancelled-task focus checks wait for the native dialog close event.


Cancellation coverage includes separate toolbar/X composition, 8px gap and 56px target, no duplicate clear commands, selection-only/clipboard-only/combined state at desktop/compact/short sizes, unchanged reference listings, Tab/Enter/Space focus and RTL placement. Native button activation in CDP includes virtual key codes and text events for Enter/Space.


The study suite also checks mobile action-group/FAB edge alignment and sample bucket creation: placement, disclosure, blank/duplicate validation, cancellation, filtered-list recovery, new empty destination and compact drawer/task focus/inert lifecycle. It writes `/tmp/mediastorage-bucket-dialog.png`; sample bucket validation is not a production storage policy test.


Adaptive-toolbar checks sweep 320/360/375/390/420/480px, verify 3/4/4/5/5/5 visible slots (including overflow where needed), 48px targets, hidden-command-only menu contents and disabled-state parity. They also check focus migration during shrink/grow, stable menu state when packing does not change, long-label fallback and label restoration at wide sizes.


FAB-menu geometry checks assert final trailing alignment and viewport containment at nine widths, repeat opening after viewport changes, resize an already-open menu through desktop/compact widths, and verify RTL anchoring. At very narrow widths, alignment yields to the 8px viewport boundary. Current standalone Chrome result: 365 checks passed; production integration remains untested.


Object-row regression checks cover desktop/mobile primary whitespace hit area and activation, full-row hover/press/keyboard focus styling, independent checkbox and folder-info actions, and RTL/dark-theme hit testing. The suite writes `/tmp/mediastorage-row-feedback.png`. Current standalone Chrome result: 383 checks passed; real touch/screen-reader and production integration remain pending.


## Production explorer 0.3.0

Run `sh scripts/php-snap.sh tests/explorer.php` for the 69 baseline checks plus 23 additional bucket/copy checks. The token suite now passes 66 checks, including separate bucket-root restrictions and scope changes after a session move. Schema checks cover populated 0.1 → 0.2 → 0.3 upgrades and re-entry with nodes/tokens preserved (SQLite execution; MySQL/PostgreSQL SQL generation).

`npm ci --ignore-scripts && npm run build` builds the real Vue/Material frontend. `npm test` checks name byte bounds and media picker allowlist. `node tests/frontend/browser.mjs` uses the built bundle with an ephemeral HTTP fixture server and Chrome CDP on 9322: 32 pointer/browser checks passed, with 20 CSRF-backed fixture requests. This is **not** live Nextcloud evidence.

After deploying 0.3.0, run `MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=3 python3 tests/http_integration.py`. The current local instance passed **91 live HTTP checks**, including bucket concurrency, copy aliases, physical preservation and all Phase 2 token/lifecycle regressions. The suite owns and cleans up its own accounts/files.

`MEDIASTORAGE_TEST_DISPOSABLE=yes node tests/frontend/live.mjs` exercises the actual Nextcloud host with its own disposable account/DAV image and writes /tmp/mediastorage-live-mobile.png, /tmp/mediastorage-live-desktop.png and /tmp/mediastorage-live-ui-results.json. Installed assets passed 30 checks; the final host layout correction passed 46 checks with `MEDIASTORAGE_TEST_CANDIDATE_ASSETS=yes`. Candidate mode intercepts only app JS/CSS with locally built assets while using real Nextcloud sessions/APIs; it is not proof that those assets have been deployed. The user subsequently redeployed; running without that flag and with browser cache disabled passed **46 checks against final installed assets**. Neither suite prints credentials or token secrets.

2026-10-10 regression expansion: 96 candidate browser checks passed, including dialog centering/containment at 1914×914, 1440×1000, 390×844, 320×568 and 1024×360; large picker/action scroll reachability; light/dark text and filled-button hover/focus/pressed colors; heading colors; successful clipboard copying and denied-clipboard fallback; native authenticated viewer redirects and anonymous login redirects. Candidate asset tests use real backend/session data. The user redeployed this correction; all 96 checks passed against installed assets with cache disabled and no interception. Dedicated account/physical fixtures are removed afterward. CDP page selection excludes Chrome extension background pages.

Corrected Copy intent: the latest suite removes native viewer/authentication redirect tests because no native Nextcloud URL is generated anymore. It verifies exact plugin virtual_path copying, displayed bucket context, denied-clipboard manual copying and success feedback, plus copied-path updates after virtual rename and folder move. All dialog/theme/action regressions remain. Candidate correction passed 96 checks. User deployment was followed by all 96 passing against installed assets with cache disabled and no interception.

## Asset cache upgrade regression

Before a frontend release, record existing app asset URLs with `MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_RECORD_ASSETS=yes node tests/frontend/live.mjs`. The snapshot defaults to /tmp/mediastorage-assets-before-upgrade.json; MEDIASTORAGE_TEST_PREVIOUS_ASSETS can override it. After building and deploying the incremented release, run `MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_CACHE_ENABLED=yes node tests/frontend/live.mjs`. Keep the same dedicated Chrome profile to preserve its HTTP cache. This mode enables browser caching, asserts that both JS/CSS URLs differ from the recorded release and compares actual HTTP bytes with the local build before the full UI regression checks. It clears fixture login cookies, not the HTTP cache. Do not combine record and cache-upgrade modes.

0.3.1 preparation: installed 0.3.0 JS/CSS bytes matched the build; unchanged cache URLs reproduced the new failing regression. Frontend build/rules and schema checks pass. The user deployed 0.3.1; 99 checks passed against installed assets with cache enabled, changed JS/CSS URLs and matching served/build bytes. The same Chrome profile retained its HTTP cache; only fixture login cookies were cleared.

0.3.2 footer verification: built-frontend fixture coverage is now 33 checks, including supplied-version rendering and removal of both slogan lines. The live suite also asserts the server-provided data-version and displayed footer match the release metadata. Production build and both changed PHP files pass syntax checks. Installed verification pending deployment.

## Material component regression (0.3.3)

`material-checks.mjs` is shared by the fixture and actual-host suites. It verifies actual pointer ripple animations for FAB/navigation/full rows/toolbar, disabled suppression, local official font loading under CSP, complete icon-button surfaces, responsive command variants and 48px targets, five commands at 390px, exact 320px overflow, Space activation, tooltip/Escape ownership, roving arrows and overflow Tab focus. FAB inset and menu alignment are checked at all four production widths.

Candidate mode now intercepts the plugin JS, CSS and font only; all APIs and authentication remain real. It deliberately skips the installed-version assertion because the new PHP bootstrap/template is not installed. The fixture verifies supplied-version rendering. Installed-version and warm-cache URL/byte checks must run after privileged deployment; candidate mode is not deployment evidence.

0.3.3 preparation verified: production build and frontend rule checks pass; 71 built-frontend HTTP fixture checks pass with 20 CSRF-backed requests. The final assets pass 134 browser checks in the actual Nextcloud host using candidate JS/CSS/font interception and disposable account cleanup. Both mobile and desktop candidate screenshots were visually inspected. Actual pointer animations, disabled suppression, keyboard/menu/tooltip interaction, full-row geometry, responsive packing and FAB/menu insets are covered. PHP bootstrap/template syntax checks pass. Source version is 0.3.3; privileged deployment, installed-version display and warm-cache upgrade verification are pending. Do not describe candidate results as installed evidence. Screen-reader, real touch and full zoom/contrast validation remain deferred.

0.3.3 installed verification (2026-10-10): after the user deployed, all **138 live Nextcloud browser checks passed with cache enabled and no candidate interception** (Chrome 154.0.8037.97). Both JS/CSS asset URLs changed from the recorded installed release and served bytes match the local build. The server supplies 0.3.3 and the drawer displays only v0.3.3. Official local icons/font and actual Material ripples load under host CSP; disabled/keyboard/menu/tooltip behavior, responsive toolbar/FAB geometry, light/dark dialog states and virtual-path/reference/token regressions pass. Installed mobile/desktop screenshots were visually inspected. The dedicated fixture account was removed and the harness exited successfully. Screen-reader, real touch and full zoom/contrast validation remain deferred.

## 0.3.4 picker and labeled-button regression

The shared checks measure actual icon/label separation and leading/trailing padding for Add bucket, plus labeled toolbar gaps. Picker fixtures provide nested real DAV folders in the live suite and equivalent HTTP fixture listings. At 1440/390/320px, checks cover one navigation row, 48px Back/Home controls, disabled root/pending states, long folder labels with accessible full paths, exactly one-level Back, direct keyboard Home, focus return and preservation of selected file/name. A nested compact screenshot is written to /tmp/mediastorage-picker-nested-mobile.png.

The official font subset includes arrow_back and home; build emits a content-hashed query suffix. Shared checks require this suffix, and installed mode additionally compares fetched font bytes to the local subset. This prevents stale font caches independently of versioned JS/CSS URLs.

0.3.4 preparation verified (2026-10-10): production build and frontend rule checks pass. 107 built-frontend fixture checks pass with 20 CSRF-backed API requests; 170 actual-Nextcloud candidate browser checks pass using local JS/CSS/font interception and disposable DAV folders. The original installed spacing failure was reproduced (53px Add bucket width, zero padding) before correction. Rendered Add bucket and labeled toolbar spacing, one-row picker navigation, root/pending disabled state, parent/Home keyboard behavior, focus return, long names, selection/name preservation and content-hashed font URL pass. Candidate desktop, dark compact picker and nested compact screenshots were visually inspected. Installed baseline is still 0.3.3; 0.3.4 deployment and installed warm-cache/font-byte verification remain pending. No API/schema changes.


## 0.3.5 token dashboard preparation — 2026-10-10

Before changes, installed 0.3.4 passed 172 actual-host browser checks without candidate interception; asset URLs were recorded for the next warm-cache upgrade. Source 0.3.5 build and frontend model tests pass; token service/controller suite passes 73 checks, explorer passes 69 + 23 checks, and schema checks pass (SQLite execution; MySQL/PostgreSQL SQL generation only). The built-frontend HTTP fixture passes 132 browser checks with 24 CSRF-backed requests, including four summary counts/filtering, revoked/expired precedence, search/reset/sort, configured one-hour expiry, typed over-limit rejection preserving drafts, absent-policy fail-closed behavior, copy success/denial/manual selection, secret cleanup and 320/390/840/1440/1914px geometry. Fixture viewport setup now gives html/body explicit height so screenshots reflect the intended viewport rather than an initial browser-window height.

Desktop light and compact dark dashboard fixture screenshots were visually inspected (`/tmp/mediastorage-tokens-1440-light.png`, `/tmp/mediastorage-tokens-390-dark.png`); they contain only fixture token metadata and no secrets. Secret dialogs are excluded from screenshots. Installed 0.3.5/API-policy and warm-cache acceptance, updated live HTTP checks, screen-reader, real touch and full zoom/contrast validation remain pending. Candidate asset-only interception cannot validate new PHP policy metadata, so no 0.3.5 candidate result is claimed. No schema change.


## 0.3.6 bucket removal preparation — 2026-10-10

Installed 0.3.5 passed 192 actual-Nextcloud browser checks without interception; its asset URLs were recorded for the next upgrade. Source 0.3.6 passes production build and frontend model tests, 69 baseline + 38 bucket/copy checks, 76 token/scope checks, and schema checks (SQLite execution, MySQL/PostgreSQL SQL generation only). The built-frontend HTTP fixture passes 151 browser checks with 36 CSRF-backed requests. New checks exercise hidden-at-rest/reveal-on-hover, sibling 48px actions, default Library protection, keyboard Enter/Tab/Escape, compact focus/touch discovery, RTL, unchanged label typography, cancellation/focus restore, retry after simulated connection failure, inactive/current removal and fallback to Library. Desktop/compact removal screenshots were visually inspected; original-file preservation, nested metadata deletion, exact traversal boundary, rollback and token-boundary retention are covered by service tests.

Updated live browser and Phase 3 HTTP suites prepare installed endpoint/CSRF/owner/physical-byte/token-boundary/concurrency checks. They have not run against 0.3.6: the new PHP route must be deployed first. Asset-only candidate interception cannot prove this endpoint. No 0.3.6 installed/candidate result is claimed. Screen-reader, real touchscreen and complete zoom/contrast validation remain pending. No commit/push requested for this revision.

## 0.3.7 bucket management preparation — 2026-10-10

Supersedes the undeployed 0.3.6 removal-only UI. Production build and two frontend model suites pass; PHP strict-interface doubles pass 69 baseline + 62 bucket/copy checks and 76 token/scope/lifecycle checks. Schema tests execute SQLite upgrades and validate MySQL/PostgreSQL SQL generation only. Python HTTP harness compiles; this is not an HTTP execution result.

The production-frontend HTTP fixture passes **163 browser checks with 47 CSRF-backed requests**. Coverage includes hover/focus edit disclosure on every bucket including Library, independent navigation/action targets, invalid and successful current/default rename with stable identity, disabled default deletion, default/current clear, repopulation after clear, draft-preserving confirmation Cancel/Escape, retry after simulated failure, deletion fallback, keyboard/focus, typography, 48px targets and desktop/390px/320px RTL dialog containment. Desktop and 390px editor screenshots were visually inspected; screenshots contain fixture data only. Backend doubles additionally verify exact name uniqueness, rollback, owner/type/default protection, traversal bounds, retained root keys, subtree/binding cleanup and original-file preservation.

Installed baseline remains 0.3.5: 192 actual-host browser checks passed without interception. New backend routes require privileged deployment before installed 0.3.7 browser/cache and Phase 3 HTTP acceptance. Prepared HTTP checks include rename/clear ownership and CSRF, duplicate/invalid names, stable default identity, retained empty roots, other links and exact original bytes, plus removal concurrency/token boundaries. These updated installed suites have **not run**. Screen-reader, real touchscreen, complete zoom/contrast and other database execution remain pending. No new commit or push requested.

0.3.8 color-only follow-up: production build and all 163 built-frontend HTTP-fixture browser checks (47 CSRF-backed requests) pass. The updated compact editor screenshot was visually checked: Clear contents/Delete bucket use neutral text and icon colors. Existing disabled/default protection and confirmation behavior passed the same suite. Installed 0.3.8 verification remains pending deployment.

## UI-03 actual-host candidate evidence — 2026-10-10

Production build and three frontend model suites pass. The actual Nextcloud host passed **243 browser checks with candidate JS/CSS/font assets and real session/CSRF-backed APIs**, cache disabled, using a disposable account that was removed. Server-supplied version observed during this run was 0.3.8; candidate frontend is 0.3.9. No installed 0.3.9 result is claimed.

Coverage includes current/default bucket rename/clear/delete protection, modal cancellation/focus, URL Back/Forward, reload, nested Unicode breadcrumbs/search, sort, folder details, tokens page, unsaved dialog dismissal, missing/cross-bucket/deleted destinations, delayed requests, simulated 401/503 response handling and retry, pending-mutation navigation, unchanged host URL and original physical bytes. An initial harness failure selected the Nextcloud shell h1; assertions now scope to #main. Actual-host Escape evidence identified host default prevention after capture; plugin dialog Escape handling fixes this without changing shell listeners. Physical touchscreen, screen-reader and full zoom/contrast validation remain pending.

For installed acceptance after root deployment, run the actual-host suite without candidate interception and with cache enabled, comparing the recorded prior asset URLs. The updated Phase 3 Python HTTP suite still requires its separate execution; browser checks do not imply its concurrency/HTTP assertions passed.

Final built-frontend HTTP fixture: **190 checks passed with 154 CSRF-backed requests**, including compact Back/reload/focus, 205-row pagination over offsets 0/100/200, accurate counts, and scroll restoration on Back/reload. Fault injection deliberately simulates delayed fetches, 503 and expired-session 401 responses; these are UI recovery checks, not proof of a real session timeout.

Final UI-03 acceptance preparation: **245 actual-Nextcloud candidate browser checks passed**, cache disabled, including the final compact reload/Back/focus additions. Dedicated fixture account cleanup completed. Production build, three frontend model suites and **190 HTTP-fixture browser checks** pass. Final source/build is 0.3.9; installed/warm-cache acceptance awaits privileged deployment. No new commit or push.

## UI-09 upload and preview acceptance (0.4.0)

Local service/controller checks use strict installed public-interface doubles, not a live filesystem/database:

```bash
sh scripts/php-snap.sh tests/uploads.php
sh scripts/php-snap.sh tests/schema.php
npm test
npm run build
node tests/frontend/browser.mjs
```

Prepared source passes 45 new upload/preview/isolation checks and 213 fixture browser checks; schema tests execute populated SQLite upgrades through 0.4, with MySQL/PostgreSQL SQL generation only. Fixture multipart responses do not prove live PHP uploads or Nextcloud preview availability. Screenshots in /tmp contain fixture data only.

After privileged deployment of the new backend/schema, execute the dedicated-account HTTP suite and actual installed browser suite:

```bash
MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/upload_http.py
MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=3 python3 tests/http_integration.py
MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_CACHE_ENABLED=yes node tests/frontend/live.mjs
```

These new installed upload/preview suites have not run yet. `upload_http.py` verifies real multipart/CSRF/MIME/owner boundaries, byte preservation, daily paths, same-ID retries, preview and content bridge, and original moves through Nextcloud. It removes only its own disposable accounts (including their test files). Never run with real user identifiers. `upload-live-checks.mjs` requires installed 0.4.0 PHP even when using candidate frontend interception. Real video codecs/Range playback, screen-reader and physical touch remain additional acceptance work.

0.4.1 upload regression: tests/uploads.php now models Nextcloud consuming/closing the newFile input stream, as well as storage leaving it open. Fixture upload checks cover direct/reconciled success notices, responsive containment, Files directory links, dismissal/focus and optional-location failures. tests/upload_http.py deliberately requires the first upload request to succeed; do not accept a successful Retry as a passing initial-upload result. Installed tests require the corrected PHP deployment.
