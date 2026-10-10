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
