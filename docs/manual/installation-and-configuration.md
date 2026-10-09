# Installation and Configuration

No installable app exists yet. These are planned deployment requirements.

Identify the target release, PHP runtime and database first. Once implemented and built, install the app as `custom_apps/mediastorage`, with dependencies and compiled assets included, and enable through Nextcloud's supported app mechanisms. Run migration and enablement checks on a disposable instance before production. Exact commands and package layout will be verified during Phase 1.

The app must work under its native Nextcloud route without proxy rewrites. Defaults require authorization for all media. Future configuration includes upload limits, allowed media types, domain allowlists, URL lifetime bounds, rate limits and backend access restrictions. No configuration keys are currently implemented.

Keep server tokens in backend secrets; never expose them in browser JavaScript, public environment variables or mobile binaries. Back up application metadata together with Nextcloud files and database. Restore consistency must be verified, including file bindings.
