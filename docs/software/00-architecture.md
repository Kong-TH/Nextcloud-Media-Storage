# Architecture

Design status: Planned.

The app lives at repository root and is installed as `custom_apps/mediastorage`. Expected directories are `appinfo`, `lib/AppInfo`, `lib/Controller`, `lib/Service`, `lib/Db`, `lib/Migration`, `lib/Exception`, `src`, `templates`, and `tests`.

Thin controllers delegate to services. Persistence classes use Nextcloud's database connection/query builder. Migrations manage app-owned tables only. Services receive public Nextcloud interfaces through dependency injection. Do not introduce an external ORM, database, storage engine, or core modifications.

VirtualFileSystemService owns hierarchy rules; MediaStorageService owns official Node API operations; MediaResolverService resolves owner-context bindings; ApiTokenService owns credential lifecycle; MediaDeliveryService owns read-only streaming; MediaAccessPolicyService and MediaSecurityService own policy and authorization. Add abstractions only when implementation needs them.

Management sessions retain Nextcloud authentication and CSRF protection. Future external API exceptions must be narrow and paired with explicit bearer authentication and authorization. No anonymous media route belongs in Phase 1.
