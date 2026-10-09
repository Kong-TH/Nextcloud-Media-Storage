# Product Backlog

US-MS-01–03 are implemented and verified by unit/schema checks and 33 live HTTP checks on Nextcloud 34.0.4 / Snap MySQL. Extended acceptance gates remain pending. US-MS-04 passed local tests and the combined 70-check live suite after upgrade to 0.2.0. US-MS-05–09 remain Planned. Phase 3 preparation is next; bucket semantics must be resolved before bucket persistence.

| ID | Phase | Deliverable | Acceptance evidence |
| --- | --- | --- | --- |
| US-MS-01 | 1 | Native app and verified target | Enable app on target; migration install and upgrade pass |
| US-MS-02 | 1 | Owner-isolated virtual hierarchy | Create, rename, move, delete, search and resolve; duplicate/cycle/traversal tests |
| US-MS-03 | 1 | Nextcloud file binding | Owner-context resolution, missing/ambiguous binding and virtual-only deletion tests |
| US-MS-04 | 2 | Scoped API credentials | Missing/invalid/expired/revoked tokens denied; scope and cross-user tests |
| US-MS-05 | 3 | App-scoped Material Vue explorer with bucket drawer | User can navigate and manage media without typing full paths |
| US-MS-06 | 4 | Temporary media access | Expiry, resource tampering and revocation tests; no long-lived browser secret |
| US-MS-07 | 4 | Streaming and abuse controls | HEAD, validators, ranges, 206/416, 429 and cache isolation tests |
| US-MS-08 | 5 | Release readiness | Actual Nextcloud/database matrix, packaging, policies and security review |

| US-MS-09 | 3 | Bucket separation (semantics pending) | Approved model; populated upgrade; owner/bucket/token isolation; virtual removal preserves physical files |

See [agent handoff](../agent-handoff.md) and [Sprint 03](sprint-backlogs/sprint-03.md) for the latest UI decisions and next implementation slices.

Later-phase work does not count as implemented merely because interfaces are designed.

Lifecycle cleanup is implemented in deployed 0.2.0; live deletion/recreation isolation passed. Wider concurrent lifecycle races remain a release review item.
