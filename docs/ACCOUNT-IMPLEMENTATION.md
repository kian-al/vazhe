# Account and cross-device sync — work in progress

This document describes the proposed implementation, not functionality currently live.

## Scope

A single verified user identity will own vocabulary, queue, batch and FSRS state on the server. Web, a future native iOS/Android app and the extension will use the same account and server-side authorization. Native apps and extension sign-in are not part of this initial database foundation. No store publication is planned now.

## Invariants

- Derive account identity from a validated server-side provider session, never a user ID supplied by a client. Fail closed if session verification fails; do not silently treat an auth outage as a guest.
- Keep account and guest rows separate; the current guest cookie and guest endpoints remain intact until account integration is complete and tested.
- Use optimistic revision checks for every write. Do not choose a last-write-wins merge or discard either device's unsynced state on a conflict.
- Scope browser caches and unsent changes to the authenticated identity. Reject writes if the identity changed between request preparation and execution, including changes in another tab. Never upload one identity's local state to another.
- Guest import requires an explicit user decision, a fully synchronized guest snapshot, both expected revisions, and a pristine account. It copies without deleting guest data. Do not silently merge nonempty collections or replace account data. Offer a backup and explain conflicts.
- Use same-origin protection for cookie-authenticated web writes. A future native client needs an explicitly designed secure token flow; do not weaken browser CSRF checks or promise native support prematurely.
- Plan account deletion including associated vocabulary, session revocation, retention and backup/export. Do not expose incomplete deletion as functional.

## Current work

The migration adds `account_vocab` separately from existing data. Parameterized SQL provides isolated read/write with revision checks and an atomic guest-to-empty-account copy. `tests/account-data.test.ts` runs against a local PGlite PostgreSQL engine, not a production database. No production migration has been run. A Neon Auth proxy and account-only state/import endpoints are implemented in the draft, but the web store and UI are not connected to them. They are not deployed or validated end to end. No account sync or mobile app is live yet.

## Before release

1. A separate Neon test branch has Managed Better Auth enabled with shared email, OTP verification required and session revocation on password reset. Configure trusted origins and a strong server-only cookie secret for each environment; provision production only after the flow is tested. Keep the free plan.
2. Use the requested shared email provider for initial testing, with OTP verification and password reset. Neon recommends custom SMTP for production; shared delivery is limited, so clearly disclose this limitation and verify email delivery end to end. Do not add credentials to Git or screenshots.
3. Implement provider proxy and verified session handling, email signup/login/verification/recovery, account UI adapted from the approved prototype, secure cache partitioning and explicit import flow. Update privacy disclosure.
4. Test authenticated API isolation, CSRF, account switch across tabs, stale revisions, offline outbox, failed sync and guest migration; verify UI at mobile and desktop sizes. Use an isolated test database and test users.
5. Only after review: run the additive migration on the intended production database, configure secrets, deploy, and verify with isolated accounts without altering real users' data.

Reference: https://neon.com/docs/auth/production-checklist
