# GitHub build and releases

## Purpose

`.github/workflows/release.yml` builds Media Storage on GitHub-hosted Ubuntu 24.04 with Node 24 and the existing deterministic package scripts. Public GitHub Release assets can host downloads independently of the self-hosted GitLab/MinIO instance. GitLab CI remains available and unchanged.

The workflow must be pushed to the GitHub repository, not only to self-hosted GitLab. Enable GitHub Actions for the repository and ensure repository/organization rules permit the release job's `contents: write` permission and tag creation. A public repository makes published assets anonymously downloadable. No personal access token or MinIO credentials are needed; the job uses the temporary `GITHUB_TOKEN`.

## Triggers and version handling

- Push to `main`: validate metadata, test, build, verify the archive, then automatically create `vVERSION` and publish the release if it is new. No manual tag is needed.
- Open/update a pull request: run the same package checks and retain an artifact for 14 days; never publish a release.
- Actions → **Build and release** → **Run workflow**, selecting the default branch: build/test first, then create `vVERSION` at the exact checked source commit and publish a release.
- Push a tag named `vVERSION`: build/test the tag and publish a release for it. Tag must exactly match the checked app/package/lock versions.

Main pushes and the manual route create the tag automatically; it does not bump metadata or create a version-changing commit. Version authority is `appinfo/info.xml`, synchronized with `package.json` and both root versions in `package-lock.json`. Existing packaging validates agreement. The app currently supports stable three-part versions only; prerelease/build-metadata tags are rejected rather than misrepresented as stable releases.

For the first release of current 0.8.0 source, push the workflow change to main (or use Run workflow) if `v0.8.0` does not exist. For later releases, prepare and review an appropriate SemVer change in the metadata and changelog first. A new app feature normally needs a minor bump; a compatible bug fix needs a patch bump. CI tooling here leaves app 0.8.0 unchanged and does not claim a new runtime feature/version.

Manual runs are limited to the repository's default branch. Direct tag push can publish other commits deliberately; protect release tag patterns and restrict maintainers accordingly. Do not mirror remote tags destructively.

## Package and change description

Checks: version/event guards, frontend unit suites, `npm run package`, and `tests/package_release.py`. No live Nextcloud server, database migration matrix, or installed browser tests run in this workflow.

Published assets:

- `mediastorage-VERSION.tar.gz`: explicit app archive containing the `mediastorage/` directory.
- `mediastorage-VERSION.tar.gz.sha256`: checksum checked again by the publisher.

Release notes include the exact source commit, installation/signing limitations, and GitHub-generated change notes. Generated change descriptions depend on GitHub repository/PR/tag history; maintain `docs/changelog.md` for the curated functional explanation. The automatically supplied GitHub Source code archive is not the installable package.

After success, the release job summary prints the real archive URL for the current repository:

```text
https://github.com/OWNER/REPOSITORY/releases/download/vVERSION/mediastorage-VERSION.tar.gz
```

OWNER/REPOSITORY is the actual `github.repository`, not a configured example storage domain. Use the `.tar.gz` Release asset URL, not an expiring workflow artifact URL. Keep the public release assets available; GitHub hosting does not make the self-hosted source server mandatory for subsequent downloads.

## Signing and App Store limits

The existing package script generates an **unsigned** archive. This workflow publishes that same archive and checksum; it does not read your private key, sign `appinfo/signature.json`, generate the separate App Store archive signature, or register/upload to Nextcloud App Store. Release notes explicitly disclose this. Do not submit the unsigned asset as a signed App Store release.

For a signed publication, integrate Nextcloud integrity signing into a clean staged app before the final archive/checksum, then generate the App Store signature over those exact final bytes. That needs a separate verified signing workflow and protected secret setup. Never put `.key` contents in Git, job logs, or uploaded artifacts. Do not replace an unsigned published asset in place with signed bytes; publish a deliberate new release/version instead.

## Reruns and failures

Published releases/assets are not overwritten. When a published release has both expected asset names, a repeated same-version run succeeds without changing its tag or assets, even if main has newer commits. This checks asset presence, not a byte-for-byte match to the new build: a version identifies the original release permanently. To publish changed bytes, update the synchronized app version first. Draft or incomplete releases fail for manual inspection. Branch/manual runs refuse an existing tag without a release; use the existing tag's push workflow run (rerun failed jobs from Actions) rather than moving it. If publication partially succeeds and leaves a release missing assets, the guard will stop a rerun: inspect the release and repair deliberately, verifying original asset bytes, rather than using automatic clobber/delete behavior. No automatic rollback/deletion is performed.

The publisher creates missing tags and uploads assets in the same run. It does not rely on another tag-triggered workflow, because events created through `GITHUB_TOKEN` generally do not trigger further workflows. Concurrency prevents overlapping publishers; version/tag checks prevent accidental release mislabeling. All build artifacts and published archives remain unsigned. Version numbers are not automatically incremented; choose the appropriate next SemVer in source before a new app release.

## Validation record — 2026-11-09

Local frontend unit suites (6 files), production build, deterministic package/66 archive checks, and 4 release-metadata tests pass. YAML structure and embedded shell syntax were checked locally. No GitHub-hosted run, tag creation, release publication, or App Store submission was performed during implementation; external runner permissions and GitHub-side rules still require the first real run.

Automatic-main update: locally checked event gating (main/tag/manual release, PR excluded), existing-release skip behavior, and draft/incomplete failure behavior with a mocked GitHub CLI. Remote Actions execution remains unverified for this revision.
