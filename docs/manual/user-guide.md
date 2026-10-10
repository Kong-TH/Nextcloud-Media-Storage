# User guide

## Temporary access APIs — installed 0.5.1

Session clients can POST `/api/v1/nodes/{id}/signed-urls` with `ttl_seconds` to receive a one-time absolute URL and revocation ID. Nextcloud session/request-token requirements apply. Authorized integrations use the corresponding `/external/v1/nodes/{id}/signed-urls` endpoint with a server-held `media:read` bearer. Never send that long-lived bearer to the media recipient.

The recipient can open the temporary URL without signing in. Keep the complete URL private: it is a read credential reusable until expiration/revocation. Default lifetime is 15 minutes; the default maximum is one hour, and bearer-derived access ends no later than its issuer. Session owners revoke using DELETE `/api/v1/access/{id}`; external issuers use DELETE `/external/v1/access/{id}` for their own grants. Owner session metadata listing is available at GET `/api/v1/nodes/{id}/signed-urls` and cannot recover a lost URL.

A changed original, changed binding, another bucket, expired/revoked issuer or inaccessible/deleted reference prevents delivery. Revocation cannot recall bytes already downloaded/in flight. Ordinary Copy virtual path remains metadata copying; there is no new temporary-link UI control in this API story. Installed 0.5.1 temporary access acceptance passed; advanced external streaming/protection is a separate task.

## Explorer available in 0.3.0

Open Media Storage from Nextcloud's app navigation. The default Library and additional virtual buckets organize references to your accessible Nextcloud files. Use + Add beside Buckets to create another bucket. On narrow screens open the navigation drawer with the menu button. The bottom of the drawer displays the installed plugin version only (for example v0.3.3). Bucket rename/removal is not available yet.

Use the Add FAB for Add from Nextcloud or New folder. The picker browses existing images/videos. Its single folder-navigation row shows Back, Home and the current folder name: Back goes up one level and Home returns directly to Nextcloud files. Both are disabled at root and while loading. Selecting a file and saving creates a reference, without copying or moving its physical file. Open folders by clicking their row and return using the folder path. Search matches names in the current folder. The information button opens details and provides Rebind when a reference needs another accessible original. Copy virtual path copies the plugin's virtual path, such as /Campaigns/Birdie.jpg, including the reference's independent name. The containing bucket is shown separately; paths are relative to that bucket. If browser clipboard access is unavailable, a read-only text field allows manual copying. This metadata path is not a browser-openable media URL; plugin media delivery is not implemented yet.

Select rows to display the bottom toolbar. Move, Copy, Paste, Rename and Remove links change plugin metadata only. Copied references may have independent names and live in other virtual folders/buckets while sharing one original. Narrow toolbars place commands that do not fit in the arrow menu. The separate X cancels selection and copied links, then restores Add.

API tokens provides create, rotate and revoke actions with expiration and permission boundaries. Save a new secret before closing its dialog; it is shown once. Rotation leaves the old token active until you revoke it after updating your integration. Tokens authorize metadata APIs; they do not currently provide a public media URL.

Upload from your device, previews, signed URLs and binary media delivery are not available yet. Add from Nextcloud references files already uploaded through Nextcloud.

## Earlier product plan (historical)

# User Guide

The interface is planned and unavailable today.

The explorer will provide folder navigation and breadcrumbs, create/rename/move/delete, search, media upload, binding of existing files, missing-binding recovery, metadata, previews and generated URL copying. Users will not need to type full virtual paths. Virtual deletion will preserve physical files.

All media starts private. A copied path does not authorize access. External backends will use scoped tokens and either proxy media or issue short-lived read URLs for browsers. Token management will show status, expiry and last use; new secrets appear once. Rotation creates a replacement, updates the backend, then revokes the old credential.

Virtual rename/move changes paths and can break older URLs. Temporary URLs may be reused before expiry; domain filtering cannot establish website identity. Authorized users may view and save media normally.


## API token dashboard (0.3.5)

The four summaries show active tokens, active tokens expiring within two weeks, revoked tokens and expired tokens. Click a summary to filter; click it again or choose All tokens to reset the status filter. Search by name and sort by expiry or name. Counts include the complete token collection, independent of filtering. The list shows permissions, access boundary, expiry and last usage; only active tokens can be rotated or revoked. Rotation creates a replacement and keeps the old credential active until explicitly revoked.

Create token displays the latest permitted expiry in your browser's local time. The calendar and manual input use the server's configured maximum lifetime (365 days by default). Choose a future date and at least one permission. Folder-scoped tokens cannot manage credentials. If policy cannot be loaded, cancel and retry rather than assuming a limit.

The one-time secret dialog provides Copy token and Done, with spacing between the value and actions. Copy reports success and leaves the dialog open. If clipboard access is denied, select/copy the value manually; closing removes it from the UI and it cannot be displayed again.


## Manage a virtual bucket (0.3.7)

Hover over any bucket row, including Library, to reveal its trailing pencil. Keyboard focus reveals it too; on touch, select/focus the row first. The edit action is separate from navigation and opens Edit bucket without changing the current destination.

Change Bucket name and choose Save changes to rename. Names must be valid and unique among your buckets, including the default display name. Library remains reserved for the default bucket. Rename preserves identity, contents and virtual file paths.

Clear contents asks for confirmation before removing every virtual folder and link inside that bucket; the bucket remains. Delete bucket confirms removal of the bucket and its contents. Library can be renamed and cleared, but its Delete button is disabled. Original Nextcloud files and links in other buckets remain untouched. Cancel/Escape in a confirmation returns to the editor with the name draft preserved; Save changes is independent of destructive actions.

Clearing the current bucket returns to its empty root. Deleting the current additional bucket returns to the default bucket. Actions on another bucket preserve your current view. Successful clear/delete discards copied references to avoid stale sources. The 1000-node traversal limit includes the bucket root; remove smaller virtual folders first if it is exceeded. Tokens scoped to retained roots keep that scope; removed child/bucket boundaries fail closed, and name reuse does not reactivate them.

## Browser navigation (0.3.9)

Browser Back/Forward returns to previous buckets, folders, submitted searches, sort order, details and the API tokens page. Reload or bookmark the plugin URL to reopen the current view. The plugin preserves Nextcloud's own URL path/query. Names and breadcrumbs are refreshed from the server, so renaming a folder does not invalidate its stable ID.

List scrolling is retained for Back/Forward/reload in the current browser history. New navigation starts at the top. Unsubmitted search text, selected objects, clipboard, form drafts and token secrets are not saved in the URL; reload clears transient state. Browser navigation closes an unsaved dialog and waits for a pending save before changing views. Missing or removed buckets/folders recover to an accessible root with a message. A session/network error offers Retry; sign in again when the session expires.

## Upload and previews (prepared 0.4.0; deployment required)

Choose Add → Upload media, choose an image/video and confirm its display name. The dialog shows the actual upload limit. Files are stored in your own Nextcloud `Media Storage/YYYY-MM-DD/` folders, grouped by calendar day using your account timezone (UTC fallback). Originals have unique storage filenames; the display name belongs to the plugin link. Nextcloud quota and folder permissions still apply.

Progress measures transfer; saving on the server is shown separately. Stop cancels transmission and checks whether saving already finished. Retry keeps the same file/name/request to avoid duplicates; close and reopen Upload to choose another payload. Files already saved remain in Nextcloud, including partial/orphan files after a storage/database failure; manage those through Nextcloud before a fresh attempt. Move, Rename, Remove links, Clear contents and Delete bucket never change originals.

Lists show thumbnails where Nextcloud provides them. Details show image previews or a video player; unsupported providers/codecs and inaccessible originals fall back with recovery feedback. Moving an original through Nextcloud within its accessible storage keeps its file-ID link; changed storage/permissions may require Rebind. Copy virtual path continues to copy plugin metadata paths, not public media URLs. Signed/public and external-token delivery are not enabled.

### Finding an uploaded original

After Upload finishes, a dismissible notification shows the display name and the original's path in your Nextcloud account. Open folder in Nextcloud opens the containing folder in a separate tab, rather than opening the image/video. The original has a unique filename inside Media Storage/YYYY-MM-DD; the display name belongs to its virtual link. If the current location cannot be retrieved, the notification still confirms the completed upload and omits the folder action.
