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


## Current source version 0.3.0 — real explorer

2026-10-09: the current instance was found uninitialized and was initialized through Snap's web setup using its preconfigured MySQL. The user ran the updated deployment script and reported `mediastorage 0.3.0 enabled`. Live API checks were then rerun successfully (91 checks); 30 installed-frontend browser checks passed. Final host layout fixes were redeployed by the user and passed 46 browser checks against installed assets, with cache disabled and no asset interception. Historical 0.2 paragraphs above describe earlier execution, not the current installed UI.

Build before deployment with Node 24/npm 12 on this host:

```bash
npm ci --ignore-scripts
npm run build
sudo sh scripts/deploy-snap.sh
```

Pinned frontend dependencies are recorded in package-lock.json. The build emits a classic IIFE in js/mediastorage-main.js and scoped CSS in css/mediastorage.css, plus third-party notices. Compiled output and node_modules are ignored by Git and must be included in an installable package. The deployment script checks for built assets before disabling the app, then copies js/css alongside PHP and enables migrations. It never copies local credentials, tests or node_modules into the live app.

Open `/index.php/apps/mediastorage/` while signed in. The real explorer supports default Library and additional virtual buckets; existing Nextcloud image/video binding and explicit rebind; virtual folders, rename/move/copy/remove; and scoped API token management. Supported binding MIME types are the backend's image/video allowlist, excluding SVG/HTML/PDF/audio. Upload, playback/previews, public/signed media delivery and bucket rename/removal remain unavailable.

The private admin credential file at /tmp/mediastorage-nextcloud-admin.json is mode 0600. Its fields are url, username and password. Read it locally to sign in; do not paste its contents into tickets, documentation or Git. Keep credentials in a suitable password store if retaining the instance, since /tmp is temporary.

## 0.3.1 frontend cache fix

0.3.1 increments release metadata so Nextcloud generates new JS/CSS cache URLs. Same-version 0.3.0 replacement had left earlier user browsers on old UI even though installed bytes matched the build. Build/deploy with the same commands above; verify `mediastorage 0.3.1 enabled`, then reload the app normally. Restarting Nextcloud and deleting global caches are not required for this fix. Always increment app metadata and npm root version metadata when publishing changed frontend assets. No schema migration is added by 0.3.1.

## 0.4.0 upload configuration

Deploy the built 0.4.0 package and enable the app to run migration 000400 (ms_uploads). The Snap deploy script disables before replacing code, then app:enable invokes Nextcloud Installer migrations; it does not reset existing plugin metadata. Upload max_upload_bytes defaults to 104857600 (100 MiB), with a 1 GiB application cap and worker PHP upload/post limits applied. Query the authenticated uploads/policy endpoint for the effective limit; changing CLI PHP alone does not change the web worker. Account core/timezone determines dated upload folders, falling back to UTC. Uploads require an account-owned writable `Media Storage` folder and available quota. No physical-file cleanup job is installed.

## Upgrade to 0.5.1 — temporary access

Build the frontend and deploy the complete app through the existing installation procedure. Migration 000500 adds ms_access without rewriting existing tables; owner cleanup now includes grants. Use the app manager's upgrade/migration runner rather than copying only PHP files into a running enabled release. Local populated SQLite upgrade/re-entry and the actual Nextcloud 34.0.4 / Snap MySQL target have been tested; other deployments remain unverified.

Optional app setting `max_access_lifetime` is a lifetime in seconds (default 3600, clamped 60–86400); the default requested TTL is min(900, maximum). Changing this ceiling affects new issuance; existing grants keep their recorded expiry and can be explicitly revoked. Bearer-issued grants also depend on the issuer's current validity and boundary. Redact delivery `key` query values in all proxy/access/tracing logs before exposing the instance externally. See the API and reverse-proxy guides.

0.5.0 had a HEAD representation-length defect; deploy 0.5.1. Basic temporary GET/HEAD is verified, while external Range/validators, throttling and hotlink policy remain the next story.
