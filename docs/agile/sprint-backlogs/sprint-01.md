# Sprint 01: App Foundation

Goal: Install a native `mediastorage` app on the confirmed target and provide tested virtual nodes and owner-context file bindings.

Status: Documentation baseline complete; implementation pending compatibility information.

| Task | Status |
| --- | --- |
| Read specification and reference docs | Done |
| Establish documentation before code | Done |
| Determine installed Nextcloud and PHP versions | Pending |
| Verify target public APIs and select dependencies | Pending |
| Bootstrap app, routes, DI and authenticated page | Planned |
| Create portable schema/migrations | Planned |
| Implement owner-scoped hierarchy operations | Planned |
| Implement file bindings and explicit rebind recovery | Planned |
| Run unit and actual integration tests | Planned |

## Acceptance gate

Enable app without core changes. Install and upgrade migrations on actual test databases. Test root/nested creation, duplicates, invalid names, cycle-safe moves, path resolution, owner isolation, search, missing bindings, ambiguous file IDs, replacement, and reference deletion without physical deletion. Verify underlying read permissions and unchanged physical locations.

## Environment evidence

2026-10-09: `php -v` and `composer --version` returned command not found. `docker ps` could not access the Docker socket. No runtime or integration tests ran. Do not infer an installed Nextcloud version from the moving stable documentation URL.
