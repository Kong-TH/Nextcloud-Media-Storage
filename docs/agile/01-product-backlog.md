# Product Backlog

US-MS-01–03 are implemented and verified by unit/schema checks and 33 live HTTP checks on Nextcloud 34.0.4 / Snap MySQL. Extended acceptance gates remain pending. US-MS-04 passed local tests and the combined 70-check live suite after upgrade to 0.2.0. US-MS-05 and US-MS-09 are in progress: the virtual-bucket model is approved and the core Material explorer is implemented; installed uploads/previews and silent MP4/WebM session playback/ranges pass; manual accessibility/device release gates remain open. US-MS-06 is implemented and verified on installed 0.5.1: 47 temporary-access HTTP checks and 130 Phase 3 regression checks passed. US-MS-07 is implemented in committed source 0.6.0 with local checks; installed acceptance remains pending. US-MS-08 packaging is in progress, with compatibility/security/release gates open.

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

| US-MS-09 | 3 | Virtual bucket separation (approved) | Approved model; populated upgrade; owner/bucket/token isolation; virtual removal preserves physical files |

See [agent handoff](../agent-handoff.md) and [Sprint 03](sprint-backlogs/sprint-03.md) for the latest UI decisions and next implementation slices.

Later-phase work does not count as implemented merely because interfaces are designed.

Lifecycle cleanup is implemented in deployed 0.2.0; live deletion/recreation isolation passed. Wider concurrent lifecycle races remain a release review item.

UI-09 update (installed 0.4.1): session upload, persistent retry journal, daily per-account physical storage, progress/Stop reconciliation, thumbnails/details and session DAV content bridge are implemented. Installed multipart/preview and warm-cache acceptance passed; extended video playback/seek/session ranges and Phase 3 HTTP acceptance also pass. Public/signed and external-token media delivery remain planned.

## Additional UI backlog — implemented and user-accepted, 2026-10-10

UI-13 (25-object incremental scrolling), UI-14 (loaded/all-matching selection), UI-15 (multi-source picker) and UI-16 (independent keep/outer-wrapper contents choices with Material progress) are implemented. The user accepted deployed UI-16 after the 0.8.0 deployment request. Local/candidate test evidence is recorded in the handoff; this user report is not an automated installed-suite result. No additional UI feature task is currently planned. UI-10 physical mobile/keyboard, actual zoom and full-state contrast checks remain open; screen-reader testing was excluded by the user.

Remaining story work: US-MS-07 installed streaming/protection/player/parallel-limit acceptance; US-MS-08 exact-archive install/upgrade, compatibility/security/proxy/load and backup/restore validation. Signing/publication remains a separate pending release action. Earlier planned-only paragraphs and version-specific evidence above are historical.
