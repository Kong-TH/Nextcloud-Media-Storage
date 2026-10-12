# Developer Guide

Read the documentation index, current sprint and architecture decisions before code changes. Keep code, comments and technical documentation in English. Establish the target Nextcloud/PHP release before selecting packages. Use frontend components compatible with that release; the latest user choice is app-scoped Material 3 with @material/web, while preserving the Nextcloud shell. Read [agent handoff](../../agent-handoff.md) first.

Frontend release packaging uses Node, the committed lockfile, and Vite. Backend checks on this host use the Snap PHP wrapper below. Composer is not required to build the release archive.

Contributions should be narrow, preserve unrelated staged work, include meaningful tests for behavior/security changes, and update affected requirements, contracts, sprint status and changelog. Record actual test outcomes separately from planned checks.

The owner selected AGPL-3.0-or-later and author Kongphai Wutthichaiya. Before public distribution retain third-party notices, add contribution guidelines and a security reporting policy with a real private contact, and validate packaging. Do not invent contacts.

## Current executable workflow

Backend requires PHP >=8.2; the actual test CLI is 8.4.26. The app uses Nextcloud-provided classes and no additional runtime packages. `composer.json` defines PSR-4 and a test script; Composer itself is still unavailable locally. Use `sh scripts/php-snap.sh tests/run.php`, `sh scripts/php-snap.sh tests/tokens.php`, and `sh scripts/php-snap.sh tests/schema.php` on this host. See [tests](../../../tests/README.md) for the actual integration gate.

The production frontend is built from `src/` with `npm run package`. See the installation guide for the local commands.

## GitLab CI

`.gitlab-ci.yml` packages the unsigned archive on branches, tags, and merge requests. The publish job uploads `dist/mediastorage-VERSION.tar.gz` and its `.sha256` file to MinIO on the default branch and on tags.

Set these GitLab CI/CD variables. Mask `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY`. If the variables are protected, protect the default branch and release tags as well, or the publish job will not see them.

| Variable | Purpose |
| --- | --- |
| `MINIO_ENDPOINT` | Server URL with its scheme, such as `https://minio.example.com` |
| `MINIO_ACCESS_KEY` | MinIO access key |
| `MINIO_SECRET_KEY` | MinIO secret key |
| `MINIO_BUCKET` | Destination bucket |
| `MINIO_PREFIX` | Optional object prefix; defaults to `mediastorage` |
| `MINIO_INSECURE` | Optional. Set to `true` only when the endpoint uses a private TLS certificate |

The job prints a path-style object URL. It does not change the bucket policy and does not store credentials in the repository. A Nextcloud App Store download needs that object to be anonymously readable over HTTPS. Do not commit the MinIO secret or an app-signing private key.
