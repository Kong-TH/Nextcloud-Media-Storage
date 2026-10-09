# User guide

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
