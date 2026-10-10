# UI-09: upload and preview contract

Status: implemented and verified in installed 0.4.1 (2026-10-10); 26 live upload/preview HTTP checks and 257 cache-enabled installed-browser checks passed.

## Original storage and identity

Session-authenticated users upload one supported image/video at a time into their own Nextcloud home: `Media Storage/YYYY-MM-DD/`. The server captures the date using the account's `core/timezone` setting, falling back to UTC. The captured day remains stable across retries. Daily folders are created on demand, never hourly and never derived from virtual buckets. Store originals under a server-generated random filename plus a MIME-derived extension to prevent name collisions and active filename extensions; retain the user's chosen display name in the virtual reference. No existing file is overwritten, moved, renamed or deleted by this workflow. Server-random reserved names and the owner-root lock isolate plugin writes; existing reserved originals are verified rather than written again. Users may manage originals later through Nextcloud.

Server validation covers PHP upload status, real temporary-file size, content-detected MIME (the existing image/video allowlist), a configured maximum clamped to PHP request limits, destination permissions, quota and owned virtual parent/name/depth. Client checks are convenience only. Initial application maximum: 100 MiB, configurable with `max_upload_bytes`. Physical file creation and database transactions cannot be atomic. An interrupted write can leave an original without a reference; report recovery errors and never silently delete or overwrite that file.

## Retry and cancellation

Persist an owner-scoped upload journal keyed by a random client request ID. Record the payload fingerprint (parent, alias, content hash/size), captured physical path, and resulting node ID. Reserve before file creation; serialize processing with the existing owner-root lock. Identical retries return the committed result without duplicating originals or references. Reject reuse with a different payload. For a reserved upload with an existing original, verify its exact content before creating the reference; a changed/partial original requires explicit recovery through Nextcloud, never replacement. Removing the resulting reference does not make retry recreate it. Account deletion purges journal metadata alongside existing plugin data.

Use actual XHR byte progress and Material linear progress. After transfer reaches 100%, show server processing separately. Stop cancels transmission; it cannot undo an already committed upload. Reconcile through the authenticated journal status endpoint, retaining the same ID/file for retry when uncertain. Show this limitation visibly. A new file selection after an attempted upload requires closing and reopening the task. Navigation/unmount aborts the client request without claiming server rollback. No upload credentials or secrets enter URLs or browser persistence.

## Preview and delivery boundary

Authenticated plugin-node preview URLs revalidate owner, stored binding/storage context and current Nextcloud readability, then request Nextcloud's preview service with bounded dimensions. Unsupported/disabled previews fall back to the type icon with useful retry feedback in details. Thumbnails are lazy and contained in existing leading slots; details use a larger image preview. Video playback uses a session-protected node content URL redirecting to the current authorized Nextcloud DAV path so Nextcloud handles range/seek. This does not implement public/signed or external-token binary delivery. All new visual styles remain scoped to the plugin.

## Acceptance

Cover account/parent isolation, CSRF, MIME spoofing, invalid/oversized/empty/partial uploads, unwritable folders, quota, date boundaries, duplicate names, same-ID retry/conflict, physical-file preservation after reference deletion, aborted/ambiguous completion and preview access failures. Browser coverage includes file choice, validation, measured progress, cancel/retry, Add menu, compact/desktop containment, a short dark/RTL viewport, pinned title/actions with an internally scrolling body, focus and missing preview fallback. Installed backend checks require deployment; fixture results must be reported separately.

## Upload correction and success notice — 2026-10-10

The installed first-attempt failure was reproduced with a disposable account. The authenticated Log Reader API records `TypeError: fclose(): supplied resource is not a valid stream resource` at UploadService line 109. Nextcloud 34's View::file_put_contents consumes and closes the supplied stream; our unconditional finally block closed it a second time after the physical write. Retry bypassed newFile and recovered the reserved original. Close only still-open resources, and make the strict filesystem double consume the stream like the real implementation.

After upload or successful reconciliation, show a persistent, dismissible success notification with the virtual display name and the original's current account-relative Nextcloud path. Resolve that path from the existing owner-authorized node details API; failure to retrieve location must not turn a committed upload into an upload failure. Provide a Material text link opening Nextcloud Files at the containing folder, not the image viewer or DAV binary. Encode the directory query through the Nextcloud router and open a separate tab, retaining the plugin view. Keep the notice inside the plugin, contained on compact screens, with status announcements and keyboard-accessible open/dismiss actions. No upload response or schema change is needed.

Acceptance: first upload succeeds when newFile closes the input stream; retry remains idempotent; success notification appears on direct success and lost-response reconciliation; location failures retain success without inventing a path; special characters in directory names are encoded; both themes, compact/desktop and RTL remain contained. Installed acceptance requires redeploying the backend fix.

0.4.1 acceptance: installed version/build assets confirmed; 26 live HTTP upload/preview checks and 257 cache-enabled installed-browser checks passed. First request succeeds and notification location/folder action work. Fixture/unit evidence is separate; see validation.md for limitations.
