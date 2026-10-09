# Sprint 03: Buckets and Material Explorer

Status: Planned; no bucket or frontend implementation yet. Phase 2 is verified on the local Nextcloud 34.0.4 / Snap MySQL environment. See [agent handoff](../../agent-handoff.md) for current decisions and execution context.

## Scope and dependency

The user added bucket separation and app-scoped Material UI. Virtual bucket versus real S3/MinIO semantics remain unanswered. Resolve that storage-model question before persistence/migration code; independent frontend setup may proceed. The proposed virtual owner/bucket/folder/reference hierarchy is not accepted yet.

## Work packages

1. US-MS-09: define and implement approved buckets, owner isolation, migration of existing roots/data, API/token compatibility and regression checks.
2. US-MS-05: Vue/Material build; app-scoped theme; bucket drawer; breadcrumb/object list; folder operations; binding/rebind; upload; previews; token dashboard.
3. Update architecture/schema/API/security and operations docs before dependent changes, then record actual checks as each slice completes.

## Acceptance gates

- Populated 0.2 upgrade preserves nodes, bindings, physical files and intended token access; invalid cross-owner/cross-bucket access is denied under concurrent changes.
- Real session/CSRF-backed operations work without manually entering full paths; primary/secondary/selection actions do not conflict.
- Drawer, dialogs, focus return, keyboard, RTL, narrow layouts, both themes and reduced motion are checked in the actual Nextcloud host.
- No CSS/theme changes spill into the Nextcloud shell. True browser-modal behavior and scrim scope are verified, not inferred from scoped CSS.
- Upload validates permission, MIME and size using supported APIs. Missing bindings have an explicit recovery path.
- Token issue shows secrets once; no long-lived external token in browser persistence/logs.
- URL copying never advertises nonexistent delivery/security guarantees; signed access and streaming remain Phase 4.

No deadline, implementation owner, new app version, or tested dependency version is assigned by this document. Keep deployment and test claims tied to recorded execution.
