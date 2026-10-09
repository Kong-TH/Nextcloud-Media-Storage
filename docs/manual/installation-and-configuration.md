# Installation and Configuration

The backend foundation and installable metadata exist. Author: Kongphai Wutthichaiya. Licence: AGPL-3.0-or-later. App 0.2.0 is enabled and 70 live HTTP checks passed on the local Snap instance.

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

It checks initialized status, copies only app files into `/var/snap/nextcloud/current/nextcloud/extra-apps/mediastorage`, enables the app through occ (including migrations), and lists enabled apps. It does not modify core files. Root is required to write Snap's application directory; the current sudoers rules permit only status/services/port inspection. The user ran the deployment script successfully for installation and the 0.1-to-0.2 upgrade; app 0.2.0 is enabled. Re-running copies updated app files without removing old files.

The Phase 1 management page only identifies the available backend foundation. It is not the Phase 3 Vue explorer. See [API contract](../software/05-api-contract.md) for current session endpoints.

## Upgrade to source version 0.2.0

After reviewing the source/local tests, run the same root deployment script. It now disables only mediastorage before copying, then enables it again to execute pending app migrations. Do not use app:enable alone on an already enabled app: installed Nextcloud command source exits early. Metadata/tokens are preserved by disable/enable. A failed copy/migration leaves the app disabled; inspect its output before retrying. No global Nextcloud upgrade or core-table editing is performed.

0.2.0 adds a token table and server-to-server metadata/management routes, not a browser explorer or binary delivery. The test-host dashboard remains a foundation page. Token lifetime policy can be configured through Nextcloud's supported app configuration facility using `max_token_lifetime` seconds, default 31536000. Prefer short lifetimes and explicit least-privilege scopes. After deployment run the Phase 2 HTTP suite described in [tests](../../tests/README.md).

The local 0.2.0 upgrade and Phase 2 HTTP suite have now completed successfully (70 checks). The management page remains a foundation page; token management is currently API-based until Phase 3 UI work.
