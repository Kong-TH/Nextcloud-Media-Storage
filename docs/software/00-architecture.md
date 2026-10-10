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
