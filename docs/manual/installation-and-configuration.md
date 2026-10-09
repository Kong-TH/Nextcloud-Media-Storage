# Installation and Configuration

The backend foundation and installable metadata exist. Author: Kongphai Wutthichaiya. Licence: AGPL-3.0-or-later. App 0.1.0 is enabled and 33 live HTTP checks passed on the local Snap instance.

Identify the target release, PHP runtime and database first. Once implemented and built, install the app as `custom_apps/mediastorage`, with dependencies and compiled assets included, and enable through Nextcloud's supported app mechanisms. Run migration and enablement checks on a disposable instance before production. Exact commands and package layout will be verified during Phase 1.

The app must work under its native Nextcloud route without proxy rewrites. Defaults require authorization for all media. Future configuration includes upload limits, allowed media types, domain allowlists, URL lifetime bounds, rate limits and backend access restrictions. No configuration keys are currently implemented.

Keep server tokens in backend secrets; never expose them in browser JavaScript, public environment variables or mobile binaries. Back up application metadata together with Nextcloud files and database. Restore consistency must be verified, including file bindings.

## Local Snap development installation

Nextcloud is initialized on `http://127.0.0.1`, version 34.0.4. Local test admin credentials are stored outside Git at `/tmp/mediastorage-nextcloud-admin.json`, mode 0600. This is temporary test-instance state; retain/manage credentials securely if the test instance is kept.

Metadata is already configured. To regenerate the same metadata:

```bash
sh scripts/php-snap.sh scripts/configure-metadata.php 'Kongphai Wutthichaiya' 'AGPL-3.0-or-later'
```

Review and run the prepared deployment script in the host terminal:

```bash
sudo sh scripts/deploy-snap.sh
```

It checks initialized status, copies only app files into `/var/snap/nextcloud/current/nextcloud/extra-apps/mediastorage`, enables the app through occ (including migrations), and lists enabled apps. It does not modify core files. Root is required to write Snap's application directory; the current sudoers rules permit only status/services/port inspection. The user ran this deployment script successfully; app 0.1.0 is enabled. Re-running copies updated app files without removing old files.

The Phase 1 management page only identifies the available backend foundation. It is not the Phase 3 Vue explorer. See [API contract](../software/05-api-contract.md) for current session endpoints.
