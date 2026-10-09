# Project Overview — Nextcloud Media Storage

Updated: 2026-10-09

## Product and scope

One native Nextcloud application, ID `mediastorage`, provides a virtual image/video hierarchy independent of physical files. Nextcloud remains the storage, identity, and database provider. Multiple virtual references may point to one physical file.

External backends will use scoped bearer tokens. Browsers will use a backend proxy or resource-specific temporary URLs. All media is private by default. Hotlink checks are advisory browser protections, never authentication.

## Current state

The repository initially contained only a staged `.gitignore` and the task specification. Documentation is now established before code. No app, migrations, tokens, explorer, delivery controls, or tests are implemented. PHP and Composer are absent from the current shell. Access to the Docker daemon was denied during read-only inspection; container contents and installed Nextcloud version remain unknown.

## Delivery phases

1. App foundation: version verification, app bootstrapping, migrations, virtual hierarchy, filesystem integration, core tests.
2. Secure API: token lifecycle, scopes, owner isolation, secure operations and security tests.
3. Explorer: navigation, upload, binding/recovery, preview, URL copying and token UI.
4. Delivery: signed URLs, advisory hotlink protection, abuse controls, range streaming and private caching.
5. Release: integration/database matrix, security review, packaging and contribution policies.

## Decisions still needed

Confirm installed Nextcloud version and test-instance access. Choose dependency versions against that release. Confirm project license and copyright ownership before public distribution; none are invented here. Establish a private vulnerability reporting channel before release.

## Completion rule

Each feature needs implementation, meaningful tests, documented limitations, and status updates. No version or database support is claimed until tested on the corresponding environment.
