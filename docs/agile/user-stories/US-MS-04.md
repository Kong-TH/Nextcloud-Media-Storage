# US-MS-04: Scoped Backend API Credentials

Phase: 2. Status: Implemented and verified on the local Nextcloud 34.0.4 / Snap MySQL instance.

As an application backend, I can use a revocable short-lived credential with explicit owner and folder permissions without exposing a main secret to browsers.

## Acceptance

256-bit random secrets appear once; only verifiers persist. Authenticate missing/invalid/expired/revoked credentials with uniform safe 401 errors. Validate enabled/existing owner. Scope checks are explicit. Source/destination ancestry checks share a transaction lock with mutations. Verify read/manage/delete/token-management separation, relative scoped output, physical-ID restrictions, no session fallback, expiry, rotation overlap and revocation. Session management keeps CSRF. Tokens/secrets never appear in logs or shared caches.

## Evidence

61 local token/scope/lifecycle checks and incremental schema tests passed. The 0.1-to-0.2 upgrade succeeded and the combined Phase 1/2 live HTTP suite passed 70 checks. See [Sprint 02](../sprint-backlogs/sprint-02.md).
