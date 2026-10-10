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

## UI-10 extended installed acceptance

Requires the authorized local disposable instance, private test credentials outside Git, matching installed assets, Chrome/CDP and ffmpeg with libvpx-vp9/libx264. Generate two tiny synthetic, silent 160x90, two-second videos (no personal media):

```sh
sh scripts/prepare-test-media.sh
MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_EXTENDED_ONLY=yes node tests/frontend/live.mjs
MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_CACHE_ENABLED=yes MEDIASTORAGE_TEST_EXTENDED=yes node tests/frontend/live.mjs
```

The focused command covers native dialog names/background exclusion/Tab/Escape/focus return, measured opaque theme contrast pairs, narrow reflow, targeted enlarged text, reduced motion, emulated touch, and real WebM/MP4 metadata/play/seek plus session DAV 206 exact bytes and 416. Chromium may expose BODY as a noninteractive focus sentinel during Tab; tests forbid focus on background controls, retain native :modal semantics and re-enter the dialog before its Escape check. Wait for the native close event/next-tick focus restoration.

Full mode adds the existing installed regression suite with cache enabled and exact build-asset checks. Use MEDIASTORAGE_TEST_VIDEO and MEDIASTORAGE_TEST_VIDEO_MP4 only for alternative synthetic fixtures; expected duration/dimensions are fixed. Never use personal video files. The account and all physical fixtures are removed on exit. Focused results are written to /tmp/mediastorage-integrated-results.json; full results to /tmp/mediastorage-live-ui-results.json.

These tests do not certify WCAG conformance or all codecs: physical touch/keyboard (including the virtual keyboard), real browser zoom and every composited visual-state contrast check require the manual checklist in docs/design/integrated-acceptance.md. Actual screen-reader testing is out of scope for UI-10 at the user's request on 2026-10-10, superseding historical pending notes; existing accessibility-tree and keyboard tests remain. No original-file mutation endpoints or Phase 4 public delivery are added.

Final combined acceptance: **305 actual-Nextcloud browser checks passed**, using installed 0.4.1 assets, cache enabled, no asset interception, including the new UI-10/video checks. The dedicated account and generated originals were removed. No production change/deployment was needed. Phase 3 HTTP acceptance separately passed 130 checks.

## US-MS-06 temporary access — 0.5.0 prepared

```bash
sh scripts/php-snap.sh tests/access.php
sh scripts/php-snap.sh tests/schema.php
# Only after installing 0.5.0 on the authorized disposable host:
MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/access_http.py
```

Local: 63 capability checks plus 76 existing token/scope checks pass. Coverage includes TTL policy, one-time verifier storage, cross-owner/issuer boundaries, exact expiry, uniform credential denial, rebind/content/storage changes, current folder/bucket scope, revocation recheck after initial lookup, safe headers, HEAD without a stream, official route parsing and revoked/deleted resources. Populated SQLite 000500/re-entry preserves old nodes/tokens/uploads; MySQL/PostgreSQL generation only. Baseline/bucket/upload suites, three frontend suites and build also pass.

The live harness provisions two disposable accounts, creates originals only in those accounts and cleans them up, including a deletion/recreation check. It never prints credentials/capability URLs. The harness is syntax-checked but **has not run against installed 0.5.0**. No 0.5.0 browser/HTTP result is claimed. US-MS-07 Range/validators/rate/hotlink controls remain unimplemented.

## HEAD integration correction — 0.5.1 prepared

Installed 0.5.0 issued/read/revoked real capabilities. The full live suite failed HEAD because Nextcloud App::main replaces a regular empty Response Content-Length with zero; Apache omits that length on HEAD. Add HeadResponse implementing the public ICallbackResponse interface, preserving representation headers without opening/outputting a stream. A local regression asserts callback behavior. Current local capability count is 64.

A separate diagnostic run passed 46 HTTP checks on installed 0.5.0 with **HEAD explicitly excluded**; this is not full acceptance. It covers bearer boundaries/revocation, expiry, rebind, physical move/content changes, original preservation and UID recreation; dedicated accounts were cleaned. Wildcard conditional requests may return 304 after valid authorization in Apache; revoked credentials still return 404. Updated tests/access_http.py expects installed 0.5.1 and retains the mandatory HEAD check. Deploy 0.5.1 and rerun the full live suite before completing the story. No new schema beyond 000500.

## Installed 0.5.1 acceptance — 2026-10-10

The user deployed 0.5.1 without errors. `MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/access_http.py` passed **47 live checks** with mandatory HEAD enabled: status 200, zero response bytes, Content-Length 68 for the 68-byte fixture. Exact anonymous GET, expiry/revocation, conditional revoked denial, owner/issuer/folder restrictions, rebind/physical move/content changes and UID recreation passed. `MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=3 python3 tests/http_integration.py` passed **130 live regression checks**. Both harnesses exited 0 and cleaned their dedicated accounts/originals. US-MS-06 is complete on Nextcloud 34.0.4 / Snap MySQL. US-MS-07 Range/validators/rate/hotlink controls and the wider release matrix remain planned. No 0.5.1 browser suite is claimed; production UI behavior did not change.

## US-MS-07 — 0.6.0 prepared

Run `sh scripts/php-snap.sh tests/streaming.php` (61 streaming/protection checks, plus 64 access and 76 token checks). After deploying 0.6.0, run `MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/access_http.py`; it uses only disposable accounts and adds exact range/conditional assertions and 120 HEAD requests plus the expected native grant 429. Quota settings must be defaults for this harness. HEAD consumes quota without opening a stream. Installed results, native player delivery, parallel concurrency and configured hotlink scenarios are pending; local doubles do not establish distributed protection or proxy behavior.

## US-MS-08 — local release packaging

Run `npm run package` and `python3 tests/package_release.py`. Python 3 uses only its standard library. The second command generates two temporary archives and passes 66 checks covering all hashes, deterministic output, required runtime files, private/development exclusions, normalized safe members, version/source/asset mismatch rejection and file/directory symlink rejection. Generated `dist/` artifacts are ignored by Git. The archive has not been installed on Nextcloud; workspace deployment is not exact-archive acceptance. See Sprint 05 for open release gates.

## UI-13 — 0.6.1 prepared

- `sh scripts/php-snap.sh tests/paging.php`: 30 checks execute installed Nextcloud QueryBuilder SQL on isolated actual SQLite, including count/type/name ordering, escaped search, owner constraints, page sizes/exhaustion and revision changes during reads. Connection bootstrapping/observability is replaced; this is not a complete Nextcloud SQLite installation.
- `npm test`: four frontend model suites pass, including ObjectPager boundaries, exhaustion, concurrency, ignored transport cancellation, failed append/retry, changed/duplicate responses and invalid progress.
- `node tests/frontend/browser.mjs`: 238 built-frontend fixture checks pass with Chrome CDP on 9322, covering initial 25/205, append failures/selection, revision reload, completion and deep scroll restoration using bounded batches. This uses a fixture API, not the installed app.
- After deployment: `MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/paging_http.py`. Prepared/syntax-checked only; creates 51 folder fixtures and one image in dedicated accounts, verifies paging/ordering/revision/ownership and removes its accounts/originals. Run the installed frontend harness separately with cache enabled, no candidate interception.

Version 0.6.1 changes no schema. UI-14 select-all and UI-15/16 multi-import remain planned.

## UI-14 — 0.6.2 prepared

`npm test` passes five frontend file suites, including the selection resolver: 100 results with loaded/unloaded exclusions, pages of 25 plus final revision validation, error/change at each batch, final-check race, duplicate/malformed page rejection and abort even when transport ignores cancellation. `node tests/frontend/browser.mjs --selection-only` is the focused browser fixture runner; the default command includes the existing regressions too. Neither runner uses installed Nextcloud assets.

Browser cases cover 25/100 loaded selection without implicit selection after append; 100/100 all-matching selection without fetching extra rows at activation; mixed state and exclusions across append; official progress and busy controls during command preparation; Copy/Paste of 99 including unloaded references; stale revision without clipboard changes; visible recovery; menu geometry at 320/390/1440, Escape/focus and RTL/Enter; official font ligatures; Remove partial failure/retry of remaining IDs; Move 30 while 25 rendered; single Rename outside the rendered page after sorting; reload clears selection. Mobile RTL/dark menu screenshot is `/tmp/mediastorage-selection-menu-mobile.png` (machine-local, not a tracked artifact).

Existing local backend checks remain separate: 30 actual SQLite QueryBuilder paging checks, 69 strict-double service checks and schema upgrade/SQL generation checks pass; five frontend suites, build and 66 archive checks pass. Installed 0.6.2 HTTP and browser acceptance remains pending privileged deployment. Physical device/keyboard, real browser zoom and all-state contrast gates remain unchanged; no screen-reader gate is added.

Final UI-14 result: **265 combined built-frontend fixture browser checks passed**, with 825 CSRF-backed fixture requests. The focused runner passed 28 checks. The first menu test clicked during animation; it now waits for opened/closed and focus. A real Enter/Space defect used click-only activation on option items; handling the library close-menu selection reason fixes both pointer and keyboard without executing on Escape. Visual inspection caught absent check/select_all ligatures and edge clipping: the official local Google Fonts subset now contains both, and scope menus fit object-list insets on compact/desktop/RTL. Preparation errors have a visible alert/reload above the list. Full final regression passed after those changes.

## UI-14 header correction — 0.6.3 prepared

Removed the standalone selection row and placed checkbox/scope arrow into the existing column-heading row. Build, five frontend suites, 268 combined fixture browser checks and 66 archive checks pass. Added checks at 320/390/1440 confirm both controls belong to the single header, share a centerline, and header height stays at most 49px including divider. Selection/API behavior is unchanged. Details-open geometry and desktop/mobile screenshots are checked separately; installed 0.6.3 evidence awaits deployment.

Focused final result: 32 fixture browser checks pass, including the details-open header test: checkbox/arrow remain inside the same header, height <=49px, and first object begins immediately after its divider. Visually inspected `/tmp/mediastorage-selection-header-desktop.png` and `/tmp/mediastorage-production-fixture-mobile.png`. The full runner passed 268 checks before adding that extra focused check; no installed 0.6.3 acceptance is claimed.

## Sticky object/detail headers — 0.6.4 prepared

Build, five frontend suites, **279 combined browser fixture checks** and 66 archive checks pass. Added tests scroll objects 600px, verify header matches the actual scrollport top and opens its scope popover, then scroll long existing details content to its end and verify Close is visible, hit-testable and clickable. Covers desktop/light and compact/dark/RTL. A geometry probe found top:0 pins at the padding edge (16px for main scroll, 28px for details); compensating those existing insets pins at the actual edge. Header dimensions and content layers are unchanged. Screenshots `/tmp/mediastorage-sticky-{objects,details}-{1440,390}.png` are machine-local fixture evidence. Scope-menu closure restores focus with preventScroll so a sticky anchor does not jump the list. All 42 focused checks pass; final desktop/light and compact/dark/RTL screenshots visually inspected. Installed 0.6.4 tests pending deployment.

## Two-row sticky header refinement — 2026-10-10

Prepared 0.6.5 follows the user request to pin the existing Objects/count/selected/Sort row together with the column header. Both existing rows share one opaque sticky wrapper; no additional visible row. Progress/errors remain outside that wrapper. Object details/Close now has a 72px minimum height and 12px vertical padding, with keyboard scroll clearance adjusted for both headers. Scope-menu focus restoration continues to preserve scroll. No API/schema or Nextcloud shell changes. Build, five frontend suites, 42 focused / 279 combined browser fixture checks and 66 archive checks pass. Desktop/light and compact/dark/RTL screenshots visually inspected. Tests verify both summary and columns remain pinned together, scroll stays unchanged after scope-menu closure, and the 72px detail header keeps Close clickable at the end. Installed verification requires root deployment.

## Consistent Material selection fields — 2026-10-10

Prepared 0.6.6 replaces all five production native selects with official @material/web 2.5.0 md-outlined-select/md-select-option: object sort, token status, token sort, Move destination and token access boundary. Preserve models, scopes, API authorization and field labels. Use top-layer popover positioning inside scrollports/native dialogs, plugin typography/color tokens and responsive widths. Escape from an open option list must not dismiss the enclosing task/details; a closed field still permits normal parent Escape. Existing scope selection retains its official md-menu. No schema/API or host-shell changes. Final local validation: build, five frontend suites, 61 focused / 341 combined browser fixture checks (828 CSRF-backed requests in the combined run), and 66 archive checks pass. Covers pointer/keyboard selection, Escape preserving parent dialogs, closed-field dismissal, async initial labels, scope enforcement UI, disabled busy state, sticky scroll preservation, viewport 320/390/1440, dark/light and RTL. Final screenshots visually inspected. Installed 0.6.6 acceptance pending root deployment; no commit/push.

Integration notes for 0.6.6: opening selects dismisses stale plugin tooltips/other menus. The installed Material select contains an md-menu whose public skipRestoreFocus property disables native scroll-moving restoration; app closure restores focus with preventScroll only while focus remains in the select/body. Outside focus is respected. Consume Escape from an option list, but allow a closed field to dismiss its enclosing dialog normally. Move destination options arrive asynchronously: wait for select/option updateComplete and reselect the model via public select(value) to refresh its headline. Tests reproduce the original blank-label and sticky-scroll failures; no Material package files are modified. Snapshot capture waits for opened/closed lifecycle events rather than mid-animation colors.

## Detail metadata and long selection labels — 2026-10-10

Prepared 0.6.7 follows user screenshots: Object details uses aligned icon definition-list rows, compact scalar values and wrapped full paths, with the existing preview/sticky Close header and actions. All five Material selects keep selected values on one line with ellipsis. A version-specific Vue directive adds selected-label ellipsis and nested-field flex sizing to the official select shadow roots because Material Web 2.5.0 exposes no label CSS part; option labels and accessible display text remain complete. Resize/update/selection lifecycle measures actual overflow and supplies the existing app tooltip only when truncated, for hover/focus. Tooltips stay suppressed while the select listbox is open so Escape closes the listbox directly. No native title, remote icon, API/schema or shell changes. Validation: production build, five frontend test files, 373 combined built-frontend browser fixture checks (832 CSRF-backed requests), and 66 release archive checks pass. Desktop/light and compact/dark/RTL detail and ellipsis-tooltip screenshots were visually inspected. Installed Nextcloud acceptance remains pending root deployment; no commit/push.

Material 2.5.0 sizing diagnosis: label-only `white-space: nowrap` cannot shrink past the nested field min-content width. Reset nested field/container flex minimums before measuring `scrollWidth > clientWidth + 1`. At 390px, the status label shrinks to 106px while retaining 183px of full text; fitting desktop labels do not receive redundant tooltips. Browser fixtures cover six media facts, compact scalar alignment, wrapped long original paths, action icon slots, dark/RTL layout, tooltip hover/focus/Escape and listbox ownership. Material delegates host ARIA attributes to `data-aria-*`; fixture selectors account for that delegation.

## Object detail row alignment — 2026-10-10

Prepared 0.6.8 fixes the user-reported label/value offset. The compact grid used baseline alignment across a flex label containing an icon and a plain value, placing values about 6px lower. Align both 24px lines at the row center. Nextcloud core also supplies 12px definition-list/term/value padding; explicitly reset that padding within plugin metadata and allow labels to wrap. Regression fixtures adopt the actual host defaults, verify a control receives them, require label/value center offsets below 1px, and verify zero metadata padding. No API/schema changes. Validation passes: production build, five frontend test files, 11 focused detail fixture checks, 376 combined browser fixture checks (832 CSRF-backed requests), and 66 archive checks. Nine focused checks also pass on actual Nextcloud using candidate frontend asset interception and a disposable account that was removed successfully; desktop/light and compact/dark/RTL host screenshots were visually inspected. This verifies host CSS integration with the candidate, not deployment of 0.6.8. Privileged deployment and installed-byte acceptance remain pending.

## UI-15 multi-source picker — verified 0.7.0

Run `npm test`, `node tests/frontend/browser.mjs --picker-only`, `node tests/frontend/browser.mjs`, `sh scripts/php-snap.sh tests/imports.php` and `python3 tests/package_release.py`. Focused browser cases cover direct-child select all, unsupported exclusion, selection/navigation independence, retention across Home, compact/dark/RTL geometry, optional single alias, ancestor/child overlap, nested structure, lost-response replay, name conflicts, official progress, Stop and 30-entry continuation without duplicates. Model tests cover bounded trees, overlapping sources, empty folders, mutated/moved sources, duplicate destination names and cancellation between writes. PHP checks use actual installed public interfaces with strict doubles; they cover source/destination owner access, folder/file type validation, UUID/name validation, immutable replay parameters, existing siblings, permission rechecks and CSRF attributes.

After privileged deployment run `MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/imports_http.py`. It provisions two dedicated accounts, tests real source authorization/metadata creation and concurrent replay through the database, enforces CSRF and verifies original bytes/path after deleting imported metadata, then removes its accounts/originals. Installed 0.7.0 passed all 19 HTTP checks. The DAV fixture setup uses the session request token alongside Basic authentication because the cookie-bearing client remains subject to Nextcloud CSRF checks.

Run `MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PICKER_ONLY=yes node tests/frontend/live.mjs` for installed picker acceptance. All 12 focused checks passed without asset interception on 0.7.0; dedicated account cleanup completed. This covers selection across navigation, nested and empty folders, selected ancestor/descendant deduplication, original bytes and desktop/compact dark/RTL geometry. Desktop and 320 px screenshots were inspected. Local validation passed 396 combined fixture checks, six frontend test files, 19 import checks plus 69 baseline service checks, build and 66 archive checks.

### Picker alignment regression — 0.7.1

Focused fixture and live picker suites assert checkbox/button center differences below 1px, zero input block margins and 48px selection targets at desktop, mobile and RTL widths. The assertion failed before the scoped CSS fix. Passed 24 fixture checks and 14 actual-host candidate frontend checks; candidate interception is not installed-version evidence.
