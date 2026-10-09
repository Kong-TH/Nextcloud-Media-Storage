# Nextcloud Media Storage

Native Nextcloud app foundation (`mediastorage`) for private virtual media organization, using Nextcloud filesystem, database, and session authentication.

**Status:** Installed 0.3.4 passed 172 actual-Nextcloud browser checks with no interception. Source 0.3.5 prepares a responsive token dashboard, server-authoritative expiry bounds and one-time secret copying; build, 132 browser fixture checks and 73 token service/controller checks pass. Privileged deployment and installed 0.3.5 acceptance are pending. The Vue/Material explorer supports virtual buckets, reference-only Copy/Paste and plugin virtual paths. Upload, previews, signed URLs and binary delivery remain planned. See [implementation and evidence](docs/software/08-production-explorer.md).

Initial target: installed Nextcloud 34.0.4 / PHP 8.4.26. Live HTTP integration is verified on this Nextcloud 34.0.4 / Snap MySQL environment only. Other Nextcloud releases and database deployments remain unverified.

Start with the [documentation index](docs/index.md), [Sprint 01](docs/agile/sprint-backlogs/sprint-01.md), [installation guide](docs/manual/installation-and-configuration.md), and [tests](tests/README.md).

## Local checks on this Snap test host

```bash
sh scripts/php-snap.sh tests/run.php
sh scripts/php-snap.sh tests/tokens.php
sh scripts/php-snap.sh tests/schema.php
sh scripts/php-snap.sh tests/explorer.php
npm ci --ignore-scripts
npm run build
npm test
```

These commands use the bundled PHP CLI and installed Nextcloud public interfaces. They do not run within Snap confinement or initialize a Nextcloud database.

## Author and licence

Author: **Kongphai Wutthichaiya**. This project is licensed under **AGPL-3.0-or-later**; see [LICENSE](LICENSE).

The owner selected this licence to align with Nextcloud. Nextcloud's [licensing notice](https://github.com/nextcloud/server/blob/master/COPYING-README) uses AGPL version 3 or later unless otherwise noted. Third-party components retain their own notices; calling an API does not by itself establish one universal plugin licensing rule.

`appinfo/info.xml` contains the configured author and licence and is validated against the installed Nextcloud schema. The template and configurator are retained for explicit metadata changes.

## Historical Phase 2 verification

Version 0.2.0 was deployed at this checkpoint. The incremental migration ran during disable/enable, and 70 live HTTP checks passed against Nextcloud 34.0.4 / Snap MySQL, including token lifecycle/scopes, real filesystem bindings, CSRF, concurrent hierarchy mutations and user-ID recreation isolation. Local checks: 69 existing checks, 61 new token/scope/lifecycle checks and SQLite populated-schema upgrade checks. See [Sprint 02](docs/agile/sprint-backlogs/sprint-02.md).

The explorer UI, upload transport, binary media delivery and signed URLs are not implemented by this change.
