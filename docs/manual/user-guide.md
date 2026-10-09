# User guide

## Explorer available in 0.3.0

Open Media Storage from Nextcloud's app navigation. The default Library and additional virtual buckets organize references to your accessible Nextcloud files. Use + Add beside Buckets to create another bucket. On narrow screens open the navigation drawer with the menu button. The bottom of the drawer displays the installed plugin version only (for example v0.3.2). Bucket rename/removal is not available yet.

Use the Add FAB for Add from Nextcloud or New folder. The picker browses existing images/videos; selecting one creates a reference, without copying or moving its physical file. Open folders by clicking their row and return using the folder path. Search matches names in the current folder. The information button opens details and provides Rebind when a reference needs another accessible original. Copy virtual path copies the plugin's virtual path, such as /Campaigns/Birdie.jpg, including the reference's independent name. The containing bucket is shown separately; paths are relative to that bucket. If browser clipboard access is unavailable, a read-only text field allows manual copying. This metadata path is not a browser-openable media URL; plugin media delivery is not implemented yet.

Select rows to display the bottom toolbar. Move, Copy, Paste, Rename and Remove links change plugin metadata only. Copied references may have independent names and live in other virtual folders/buckets while sharing one original. Narrow toolbars place commands that do not fit in the arrow menu. The separate X cancels selection and copied links, then restores Add.

API tokens provides create, rotate and revoke actions with expiration and permission boundaries. Save a new secret before closing its dialog; it is shown once. Rotation leaves the old token active until you revoke it after updating your integration. Tokens authorize metadata APIs; they do not currently provide a public media URL.

Upload from your device, previews, signed URLs and binary media delivery are not available yet. Add from Nextcloud references files already uploaded through Nextcloud.

## Earlier product plan (historical)

# User Guide

The interface is planned and unavailable today.

The explorer will provide folder navigation and breadcrumbs, create/rename/move/delete, search, media upload, binding of existing files, missing-binding recovery, metadata, previews and generated URL copying. Users will not need to type full virtual paths. Virtual deletion will preserve physical files.

All media starts private. A copied path does not authorize access. External backends will use scoped tokens and either proxy media or issue short-lived read URLs for browsers. Token management will show status, expiry and last use; new secrets appear once. Rotation creates a replacement, updates the backend, then revokes the old credential.

Virtual rename/move changes paths and can break older URLs. Temporary URLs may be reused before expiry; domain filtering cannot establish website identity. Authorized users may view and save media normally.
