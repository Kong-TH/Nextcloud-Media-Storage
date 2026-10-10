# Architecture

Version 0.3.0 implements the virtual hierarchy, persistent virtual buckets, scoped tokens and Vue/Material explorer. Upload, media delivery and later policy services remain planned.

The app lives at repository root and is installed as `custom_apps/mediastorage`. Expected directories are `appinfo`, `lib/AppInfo`, `lib/Controller`, `lib/Service`, `lib/Db`, `lib/Migration`, `lib/Exception`, `src`, `templates`, and `tests`.

Thin controllers delegate to services. Persistence classes use Nextcloud's database connection/query builder. Migrations manage app-owned tables only. Services receive public Nextcloud interfaces through dependency injection. Do not introduce an external ORM, database, storage engine, or core modifications.

VirtualFileSystemService owns hierarchy rules; MediaStorageService owns official Node API operations; MediaResolverService resolves owner-context bindings; ApiTokenService owns credential lifecycle; MediaDeliveryService owns read-only streaming; MediaAccessPolicyService and MediaSecurityService own policy and authorization. Add abstractions only when implementation needs them.

Management sessions retain Nextcloud authentication and CSRF protection. Future external API exceptions must be narrow and paired with explicit bearer authentication and authorization. No anonymous media route belongs in Phase 1.


## Production explorer

The user approved implementation and confirmed virtual buckets on 2026-10-09. See [implementation contract](08-production-explorer.md) for Vue/Material asset loading, bucket roots, session-only reference copying and compatibility boundaries. Implementation is installed locally; live API and browser checks are recorded in the implementation contract. Final installed host layout assets passed 46 browser checks.

The file-details Copy virtual path command copies the plugin's server-derived, bucket-relative virtual_path. It follows virtual aliases and folders independently of physical Nextcloud paths. It does not create an openable media URL or change access policy. Plugin-scoped Material system tokens cover component interaction states, and native modal CSS explicitly overrides the host's margin reset.

2026-10-10 user clarification supersedes the native file-link feature: Copy means the plugin's exact bucket-relative virtual_path, including virtual alias/folders. Replace Copy Nextcloud link with Copy virtual path, retain manual-copy fallback and show bucket context. This is metadata only; plugin browser media delivery is still deferred. Dialog and green interaction-state fixes remain. User redeployed the correction; 96 browser checks passed against installed assets with cache disabled and no interception.

PageController supplies the installed version using Nextcloud IAppManager, templates escape it into plugin-root data-version, and the Vue entry passes it as a required version prop. The drawer footer renders only that server-supplied version; it has no independent hardcoded frontend version label.

### Production Material controls (0.3.3)

The Vue explorer imports supported Material Web buttons, icon buttons, FAB, icon and ripple modules from the pinned local package. Responsive toolbar commands switch between labeled and icon components. Custom navigation/list/menu surfaces attach the official ripple to their semantic controls. The official Material Symbols font subset is distributed locally with its license and loaded from the plugin origin under existing Nextcloud CSP; theme roles remain scoped to the plugin. See [production explorer](08-production-explorer.md) for exact mappings. This changes presentation assets only, with no API or schema revision.


### Token dashboard and lifetime constraints (0.3.5)

ApiTokenService exposes the same clamped lifetime policy used by issuance in the authenticated token-list response. The Vue dialog refreshes it on opening and fails closed if unavailable. The datetime-local control retains native date editing with explicit bounds and associated help/errors; supported search entry uses the official Material outlined text field. Counts and name/status/sort filtering are derived from all fetched token pages, with revoked precedence and a 14-day active subset. Counts update every 30 seconds using server-adjusted time. Summary surfaces use semantic buttons with official ripple; token actions and secret copying use Material buttons. One-time secrets and clipboard feedback stay in ephemeral Vue state and are cleared on close. No schema or authorization change.


### Bucket removal (0.3.6)

BucketController delegates session-only DELETE to BucketService. The existing owner-root write lock serializes removal with hierarchy and credential mutations. Collect up to 1000 subtree node IDs before deleting bindings/nodes and the ms_buckets record in the same database transaction. Default root and non-bucket IDs remain protected. Physical Filesystem APIs are never invoked. Restricted token metadata retains its original folder ID, so a deleted boundary fails closed and name reuse cannot grant access to a replacement bucket.

The drawer composes a destination button and a sibling Material icon button in a rounded row. The trailing X reveals on hover/focus-within, preserving keyboard/touch access without permanent visual clutter. Native confirmation dialogs own keyboard handling even while the compact drawer is open. Successful removal clears stale clipboard data; current-bucket removal resets to Library, while inactive-bucket removal preserves the current view. Focus falls back to a surviving destination, drawer filter or compact navigation opener.

### Bucket management (0.3.7; supersedes removal-only UI)

BucketController also exposes session/CSRF-protected PATCH rename and POST clear. BucketService validates ownership/type and serializes rename/clear/delete with creation using the existing owner-root transaction lock. Rename updates additional bucket records and node names atomically; default rename changes only the root display name, preserving its identity/key. Clear collects the bounded subtree before removing descendants, keeping the bucket/root. Physical Filesystem APIs are not called.

All drawer rows have a sibling Material edit icon revealed on hover/focus-within. One native modal hosts the editor and destructive confirmations; Cancel/Escape returns from confirmation to the editor with draft retained. The default Delete action is disabled and explained. Successful rename updates navigation/current heading, clear resets the current bucket to its root, and deletion falls back to the default; inactive actions preserve the current view. Focus returns to an enabled surviving control.

### UI-03 browser navigation (0.3.9)

The Vue explorer owns only the #ms: fragment. A small navigation module parses/serializes page, stable bucket/folder IDs, submitted query, sort and optional details; it reconstructs breadcrumbs from authenticated node parent relationships. URL-provided names are never trusted. The existing server pathname/query, loader and authorization stay unchanged. The selected bucket must come from the authenticated bucket listing; ancestor traversal must terminate at that exact root within 128 folders. Invalid/missing destinations recover visibly, while network/session errors remain retryable errors.

Push navigation only for meaningful view changes; canonical recovery and bucket deletion use replaceState. A namespaced history.state member records list scroll, restored after loading. Popstate/hashchange are coalesced, stale route/list/detail/token requests are cancelled or ignored, and browser navigation during a mutation waits until completion. Closing a task via browser navigation clears one-time secrets. Selection and dialog/clipboard data are never serialized. No localStorage/sessionStorage or schema/API changes.

## UI-09 upload and preview source — 0.4.0

`UploadController` accepts session/CSRF-protected multipart files; `UploadService` validates real temporary-file size and content MIME before reserving an owner-scoped upload journal entry. `UploadStore` shares the connection and owner-root transaction lock with virtual hierarchy mutations. The reservation commits before physical writes; completion binds the original by file ID and commits the resulting node ID. Identical retries reuse the reservation/result. Filesystem writes cannot be rolled back with SQL: retained partial/orphan originals require explicit Nextcloud recovery, never automatic deletion. Storage folders must belong to the authenticated account and satisfy create permission and quota checks. See [upload contract](../design/upload-preview.md).

`MediaStorageService::file` centralizes current readable file/storage/MIME validation. `PreviewController` uses Nextcloud IPreview for bounded thumbnails and detail images, and redirects session content requests to the currently authorized DAV path for native Range handling. Safe image/content GETs remain authenticated; they are not public or bearer delivery endpoints. Vue `UploadPanel` owns transfer/abort/status reconciliation; `MediaPreview` owns lazy preview/fallback state. No original-file rename/move/delete operation is introduced.

## Upload stream ownership correction — 0.4.1

Nextcloud Files may close a stream supplied to newFile. UploadService closes it only if still open, preventing a second fclose from aborting metadata completion after a successful original write. Reservation/owner locking and idempotent retry semantics are unchanged. The upload-success notice reads current owner-authorized node details and opens the original's containing folder through Nextcloud Files; it does not use the preview/content bridge.

## Temporary access — 0.5.0 contract

TemporaryAccessService owns issuance, current authorization and revocation; AccessStore persists hashed per-resource capabilities. AccessController retains session/CSRF management, ExternalAccessController verifies scoped bearers, and DeliveryController narrowly permits credential-authorized public GET/HEAD. Owner-root locking serializes authorization/stream opening with metadata, token and grant mutations. Streams use the official Files API and StreamResponse, with no DAV redirect or file materialization. See [US-MS-06](../agile/user-stories/US-MS-06.md).

0.5.1 HEAD correction: a plugin HeadResponse implements public ICallbackResponse with no body callback, preserving representation Content-Length against Nextcloud App::main's empty-render rewrite. GET continues to use the official StreamResponse. No core edits or additional migration.

## US-MS-07 streaming contract

DeliveryRules computes authorized preconditions/single-range plans. DeliveryProtectionService wraps public Nextcloud rate limiting, trusted client IP, optional advisory origin policy and named concurrency locks. BoundedStreamResponse owns exact-length chunk output, timeout and cleanup; HeadResponse handles all bodyless replies. TemporaryAccessService keeps owner authorization and stream opening under the owner lock. ScopedApiService adds external IP/token throttling. No new persistence tables. See [US-MS-07](../agile/user-stories/US-MS-07.md).

## Release artifact boundary

`npm run package` builds assets, records frontend source/output hashes and invokes the standard-library Python packager. The deployable boundary is an explicit runtime allowlist, independent of the workspace and its ignored private/test files. A deterministic archive contains one application root and SHA-256 manifest; a sidecar checksum covers the archive. Version/source/output mismatch and symlink inputs fail before generation. This unsigned local artifact is separate from the Snap workspace deploy path and does not establish package installation or release support; see US-MS-08/Sprint 05.

## Incremental explorer collection — 0.6.1 prepared

The Objects view uses a bounded ObjectPager with generation/abort guards and one in-flight page. Session nodes listings opt into a revision-validated database-sorted/counting mode; legacy helper allNodes remains for destination enumeration and unrelated existing callers. The UI hydrates only each new batch of at most 25 and keeps existing rows unchanged during append/failure. Native scroll checks and a keyboard fallback load more; browser history can restore a deep scroll by loading only the pages required for that offset. Root lock_version invalidates offsets conservatively after owner metadata transactions; a changed collection requires explicit reload rather than silently skipping rows. No schema migration or bulk selection/import implementation.

## UI-14 — ephemeral bulk selection (0.6.2 prepared)

All-matching selection stores parent/search/root revision, total and excluded IDs only in memory. Commands resolve revision-validated pages of 25 and a final revision check before writes; loaded mode captures the current loaded IDs. No persisted selection, new table, migration or endpoint. Full selected metadata is held transiently at command time for clipboard/names, without rendering unrequested rows. Existing per-object owner/permission checks remain authoritative, and partial operations report success count and retain remaining IDs. This is not an atomic bulk transaction; original Nextcloud files remain unchanged. See design/bulk-selection-and-import.md and the API contract.

## UI-15 implementation contract — 2026-10-10

Authorized after checkpoint d9f2d18. Prepare 0.7.0. The existing authenticated WebDAV Depth:1 enumeration remains complete per browsed folder (no picker paging); reject listings above 1000 entries or 2 MiB instead of silently selecting a truncated subset. Select all includes eligible direct children only, excluding unsupported MIME types and missing IDs. Selection is keyed by source ID and retained across navigation; folder navigation and row checkboxes are independent. One selected file keeps its optional display name; multiple selections use source names. Selected ancestors cover selected descendants once, with an explicit covered count.

Folder import defaults to preserving structure for UI-15; per-root flatten/keep choices remain UI-16. Before writes enumerate a bounded plan (1000 entries, 128 levels), report unsupported descendants, reject repeated/cyclic source IDs and duplicate top-level destination names. Existing destination name conflicts stop without overwriting. Sequential per-entry writes recheck authenticated source and destination access. A session-only POST /api/v1/imports/entries accepts request_id (UUID), file_id, folder flag, parent_id and name. Derive node ID from authenticated owner, request UUID and source ID; owner-locked retries return the existing identical node, rejecting changed parent/name/type/binding. This makes lost-response retries safe while that node exists, without a new schema or durable job promise. Deleting the created metadata removes this retry identity; the task is memory-only and is not resumed after reload.

Use official linear progress: indeterminate enumeration, determinate completed/total writes. Retain the prepared plan and completed mapping on failure, and retry the same request UUID. Cancellation stops future entries, waits for any in-flight write, and reports already created references; no rollback or original file operation. Disable source edits once a plan is prepared; Close discards the local task, not saved metadata. UI-16 will extend review choices and large-operation lifecycle separately. APIs have no external/bearer route and retain session/CSRF middleware. Source creation, moves and deletes remain unavailable.

## UI-16 implementation contract — 2026-10-10

Authorized after checkpoint 7fe4612. Extend the existing picker in the same dialog: review effective selected roots, choose Keep folder (default) or Import contents here independently, prepare a bounded destination preview, then confirm writes. An ancestor owns selected descendants; covered descendant choices are not offered, so overlapping selections cannot prescribe contradictory layouts. Flatten removes only the selected root wrapper; direct child folders and all deeper structure remain. Empty flattened roots produce zero references, reported explicitly. Root wrappers omitted from writes still count toward the 1000 scanned-source bound.

Keep the existing 1000-source / 128-level / 2 MiB listing limits, sequential entry writes, session-only source authorization and deterministic owner/request/source identities. Review renders at most 25 roots/preview rows initially with incremental disclosure. Build the full bounded plan through asynchronous per-folder Depth:1 requests; reject duplicate destination sibling names throughout the planned tree before writing. Preflight existing destination children in revision-validated 25-row pages, bounded to 10000 examined destination entries; fail explicitly beyond that bound. Recheck destination conflicts before the first write after confirmation. Concurrent changes can still fail at the existing atomic per-entry API; no overwrite, transactional whole-tree or snapshot promise.

Keep prepared choices and completed entry mapping locked after writes begin; Retry uses the same UUID and remaining entries. Stop waits for an in-flight write and stops future work. Before any saved references, Edit choices/Back may discard the prepared plan; after writes begin only Retry or Close is offered, with confirmed counts. Reload/Close loses the in-memory operation; deterministic retry identities survive only as created metadata, not a durable job or reload-resume API. This limitation is visible in review. No schema or endpoint changes are needed. Unsupported descendants are counted/skipped; inaccessible or mutated listings fail preparation with zero writes; write-time permission loss preserves/report confirmed partial work. Originals are never moved, renamed or deleted.
