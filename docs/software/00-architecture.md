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
