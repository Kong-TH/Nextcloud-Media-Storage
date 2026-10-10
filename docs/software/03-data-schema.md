# Data Schema

Phase 1 migration implemented in `lib/Migration/Version000100Date20261009000000.php`; SQLite schema checks passed. Fresh migration execution and live app queries passed on the local Snap MySQL instance. Prior-version upgrades and the wider provider matrix remain unverified. Later-phase token/policy tables remain proposals.

| App table | Main fields | Invariants |
| --- | --- | --- |
| ms_nodes | id, owner_id, parent_id, name, name_key, node_type, created_at, updated_at | Owner-scoped identity; unique siblings; valid parent; acyclic hierarchy |
| ms_bindings | id, virtual_node_id, storage_reference, nextcloud_file_id, last_known_path, mime_type, file_size, created_at, updated_at | One binding per media node; multiple nodes may reference one file |
| ms_tokens (Phase 2) | id, owner_id, name, token_hash, scopes, folder_id, expires_at, revoked_at, created_at, last_used_at | No plaintext secrets; explicit owner and scopes |
| ms_policies (Phase 4) | id, owner_id, name, allowed_domains, require_signed_url, hotlink_protection_enabled, rate_limit_configuration, created_at, updated_at | Secure defaults and validated bounded configuration |

Use the platform table prefix facility rather than hardcoding `oc_`. Keep table/index names within supported platform limits. Root sibling uniqueness needs an explicit design: SQL NULL uniqueness cannot be assumed to prevent duplicate root names. Prefer a real owner root with non-null parent identifiers for user-created nodes.

Index owner/parent/name and owner/search lookups; uniquely index binding node ID and credential lookup identifiers. Use transactions for multi-row mutations. Validate owner/parent relationships in services even where portable foreign keys cannot express them. Store metadata, never media bytes. MySQL/MariaDB, PostgreSQL and SQLite remain untested targets.

## Implemented Phase 1 choices

Node IDs are random 128-bit hex strings; per-owner roots use deterministic SHA-256 IDs. The root has empty parent/name and an owner-derived hash key so independent roots satisfy uniqueness. Other `name_key` values hash exact validated UTF-8 name bytes. Unique `(parent_id, name_key)` avoids database name-collation differences and NULL-root uniqueness gaps. Parent IDs are globally unique app node IDs.

App table `ms_nodes` uses 64-character ID/owner/parent/hash fields, 255-character names (service limits to 255 bytes), type length 10, integer timestamps and a lock counter. The app-owned root row is updated inside each mutation transaction before hierarchy reads, to serialize per-owner writes. Actual concurrent MySQL/PostgreSQL behavior is not yet tested.

`ms_bindings` is keyed by virtual node ID and also stores owner for isolated lookups. Storage identifiers are SHA-256 hashes; file IDs and last-known paths are hints evaluated within the owner’s current filesystem context. File paths are never used for silent recovery. Last-known path allows up to 4000 characters, MIME up to 127; sizes/IDs/timestamps are bigint. No tokens or policies exist in the current migration.

## Phase 2 incremental schema

`Version000200Date20261009000000` adds ms_tokens without changing existing nodes/bindings. id is a 32-character random selector; owner length 64; name 100; token_hash 64; serialized scopes 255; optional folder_id length 64; expires_at/created_at required bigint; revoked_at/last_used_at nullable bigint. Primary key id; owner/created timestamp index. Only the SHA-256 verifier of a 256-bit random secret is persisted. The credential selector is not an authority on its own.

Executed SQLite populated-schema upgrade and re-entry checks; MySQL/PostgreSQL SQL generation only. The user ran the actual 0.1-to-0.2 app upgrade successfully; live token and node queries passed on Snap MySQL. Populated-row preservation was separately verified in the SQLite schema test. Token lifecycle changes and external authorization share the app root write lock. User creation/deletion listeners transactionally purge tokens, bindings and nodes for exactly that UID, without touching filesystem contents.


## Reference-action clarification — 2026-10-09

Multiple media nodes may already bind the same original Nextcloud file. Each virtual name/parent is independent of physical file identity. Requested Copy/Paste should create fresh virtual IDs and revalidated bindings to the same source file, never duplicate media bytes. Move/Rename preserve virtual node identity; Remove deletes only the selected virtual subtree/bindings. No migration is made by this design update. The source-clone/clipboard workflow remains unimplemented; see [reference actions](../design/reference-actions.md).


## Phase 3 virtual buckets — implementation contract

Add ms_buckets with 64-character id/owner_id/name_key, 255-character name and bigint created_at, primary id and unique owner_id/name_key. IDs also identify separate ms_nodes bucket roots (empty parent, owner-qualified name_key). Keep the existing owner root as synthetic default Library: no populated node/path rewrite. Root nodes remain mutation-protected and excluded from ordinary listing/search. See 08-production-explorer.md; migration/provider validation is pending.


## Bucket removal lifecycle (0.3.6)

No migration or column change. Delete ms_bindings and nested ms_nodes metadata child-first, then the additional bucket root and its ms_buckets record, atomically under the existing owner-root lock. All deletes are owner-scoped. Keep the owner root/default Library and unrelated bindings/nodes. Existing ms_tokens.folder_id values are retained on deletion; missing boundaries fail closed rather than becoming NULL/owner-wide. Recreating a bucket name generates a fresh ID. Original Nextcloud filecache/storage data is untouched.

## Bucket rename and clear lifecycle (0.3.7)

No migration. The default display name uses the existing owner-root ms_nodes.name; an empty legacy name displays Library. Rename preserves root ID and deterministic name_key. Additional rename updates both ms_nodes and ms_buckets names/name_keys atomically under the owner-root lock. Uniqueness is owner-local and exact-case, includes the current default display name, and reserves Library for the default. Clear removes descendants/bindings child-first while retaining the root and bucket record/name. Other bucket roots have empty parent IDs and are outside that traversal. Token folder_id values are never widened by clearing/deletion; retained-root scopes remain valid and deleted-descendant scopes fail closed.

## UI-09 upload journal — 0.4.0

`Version000400Date20261010000000` adds `ms_uploads`; no existing node, binding, bucket or token is rewritten. Composite primary key `(owner_id, id)` isolates client request IDs per account. Fields: owner_id (64), id (32 hexadecimal characters), fingerprint (64 SHA-256), physical_path (255), node_id (64, empty before completion), state (16: pending/complete), created_at (bigint). The fingerprint includes virtual parent, alias, exact content hash and size. The server reserves a random physical filename independently of the client ID and captures the account-local calendar day. Journal entries persist after link/bucket removal so retries cannot recreate deleted references, and are purged on account lifecycle cleanup. Files/media bytes are never stored in this table.

SQLite populated upgrade and migration re-entry are executed in `tests/schema.php`; MySQL/PostgreSQL SQL generation is checked separately. Live MySQL journal migration and concurrent upload acceptance require deployment and remain unverified.

## Migration 000500 — temporary access

Add ms_access: id (32, primary key), owner_id (64, owner index), node_id (64), bucket_id (64), secret_hash (64), file_id (bigint), storage_reference (64), file_etag (255), issuer_id (nullable 32), created_at/expires_at (bigint), revoked_at (nullable bigint). No plaintext secret, URL or physical path is persisted. Existing tables/data are preserved. Owner lifecycle purge deletes grants first. Node/token IDs are retained as authorization boundaries; deleting references/tokens never turns grants into unrestricted credentials. See the US-MS-06 contract for current-context validation.

## US-MS-07 persistence boundary

Streaming/protection uses existing grants plus public Nextcloud limiter and locking providers. No migration or app-owned rate/lock table is added. Core providers own their storage/expiry; owner cleanup continues to remove grants without touching physical originals.

## UI-13 paging — 0.6.1 prepared

No schema migration. Session explorer pages use existing ms_nodes.lock_version on the deterministic owner root to reject shifted pagination after metadata transactions. Existing ms_bindings owner/node join supplies cached MIME for global type ordering; count and page share owner/parent/search constraints. Old listings remain compatible. This is conservative collection invalidation, not a persisted snapshot or a bulk-selection table.

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
