# User Guide

The interface is planned and unavailable today.

The explorer will provide folder navigation and breadcrumbs, create/rename/move/delete, search, media upload, binding of existing files, missing-binding recovery, metadata, previews and generated URL copying. Users will not need to type full virtual paths. Virtual deletion will preserve physical files.

All media starts private. A copied path does not authorize access. External backends will use scoped tokens and either proxy media or issue short-lived read URLs for browsers. Token management will show status, expiry and last use; new secrets appear once. Rotation creates a replacement, updates the backend, then revokes the old credential.

Virtual rename/move changes paths and can break older URLs. Temporary URLs may be reused before expiry; domain filtering cannot establish website identity. Authorized users may view and save media normally.
