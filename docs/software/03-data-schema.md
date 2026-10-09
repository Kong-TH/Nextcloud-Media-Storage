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
