# Product Backlog

US-MS-01–03 are implemented and verified by unit/schema checks and 33 live HTTP checks on Nextcloud 34.0.4 / Snap MySQL. Extended acceptance gates remain pending. US-MS-04–08 remain Planned. Phase 1 has priority.

| ID | Phase | Deliverable | Acceptance evidence |
| --- | --- | --- | --- |
| US-MS-01 | 1 | Native app and verified target | Enable app on target; migration install and upgrade pass |
| US-MS-02 | 1 | Owner-isolated virtual hierarchy | Create, rename, move, delete, search and resolve; duplicate/cycle/traversal tests |
| US-MS-03 | 1 | Nextcloud file binding | Owner-context resolution, missing/ambiguous binding and virtual-only deletion tests |
| US-MS-04 | 2 | Scoped API credentials | Missing/invalid/expired/revoked tokens denied; scope and cross-user tests |
| US-MS-05 | 3 | Integrated Vue explorer | User can navigate and manage media without typing full paths |
| US-MS-06 | 4 | Temporary media access | Expiry, resource tampering and revocation tests; no long-lived browser secret |
| US-MS-07 | 4 | Streaming and abuse controls | HEAD, validators, ranges, 206/416, 429 and cache isolation tests |
| US-MS-08 | 5 | Release readiness | Actual Nextcloud/database matrix, packaging, policies and security review |

Later-phase work does not count as implemented merely because interfaces are designed.

Release gate: add user-deletion lifecycle cleanup for app-owned metadata and verify that recreated user IDs cannot inherit previous account media metadata.
