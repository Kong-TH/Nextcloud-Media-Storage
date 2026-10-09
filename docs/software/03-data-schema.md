# Data Schema

Proposed schema; no migrations exist yet. Final lengths, identifiers, collation behavior, index names and locking strategy require target API verification.

| App table | Main fields | Invariants |
| --- | --- | --- |
| ms_nodes | id, owner_id, parent_id, name, name_key, node_type, created_at, updated_at | Owner-scoped identity; unique siblings; valid parent; acyclic hierarchy |
| ms_bindings | id, virtual_node_id, storage_reference, nextcloud_file_id, last_known_path, mime_type, file_size, created_at, updated_at | One binding per media node; multiple nodes may reference one file |
| ms_tokens (Phase 2) | id, owner_id, name, token_hash, scopes, folder_id, expires_at, revoked_at, created_at, last_used_at | No plaintext secrets; explicit owner and scopes |
| ms_policies (Phase 4) | id, owner_id, name, allowed_domains, require_signed_url, hotlink_protection_enabled, rate_limit_configuration, created_at, updated_at | Secure defaults and validated bounded configuration |

Use the platform table prefix facility rather than hardcoding `oc_`. Keep table/index names within supported platform limits. Root sibling uniqueness needs an explicit design: SQL NULL uniqueness cannot be assumed to prevent duplicate root names. Prefer a real owner root with non-null parent identifiers for user-created nodes.

Index owner/parent/name and owner/search lookups; uniquely index binding node ID and credential lookup identifiers. Use transactions for multi-row mutations. Validate owner/parent relationships in services even where portable foreign keys cannot express them. Store metadata, never media bytes. MySQL/MariaDB, PostgreSQL and SQLite remain untested targets.
