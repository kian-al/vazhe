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

The migration adds `account_vocab` separately from existing data. Parameterized SQL provides isolated read/write with revision checks and an atomic guest-to-empty-account copy. `tests/account-data.test.ts` runs against a local PGlite PostgreSQL engine, not a production database. No production migration has been run. A Neon Auth proxy, account-only state/import endpoints, and the prototype-inspired web account UI are implemented in the draft. The UI calls the auth proxy, but the web vocabulary store is not connected to the account state endpoints. The UI explicitly warns that synchronization is not active. The flow is not deployed or validated end to end. No account sync or mobile app is live yet.

## Security and UX hardening in this draft

The JSON write endpoints use a bounded streaming reader, and the app sends basic framing, MIME-sniffing and referrer headers. Minimal allowlisted operational events are emitted to server logs without request bodies or credentials. These are **not** a durable or complete audit trail, and rate limiting, CSP, production role verification, real email, account-scoped caching and account sync remain incomplete. The account page shows a recoverable error if session discovery fails. OTP resend now calls the email-verification OTP endpoint; only a mocked browser check has passed, so real delivery is still unverified. Vocabulary mutations are blocked while the initial guest state loads, preventing that late response from overwriting an early interaction; this is not identity-scoped sync. See [ENGINEERING-SECURITY-AUDIT.md](ENGINEERING-SECURITY-AUDIT.md) for scope and remaining risks.

## Experimental outbox foundation

`src/lib/sync/outbox.ts` is an unconnected, local-only primitive, not active account sync. It partitions records by an opaque principal and a writer ID, includes the snapshot and base revision in one storage record, validates on read, and never reads or migrates legacy guest keys. Tests cover two identities, two writers, malformed data, storage failures and preliminary revision checks. The integration still must define verified server-issued guest identity, random per-writer IDs, recovery of abandoned writer records, multi-tab coordination, live session checks, server-side identity guards, conflict UX and backup, and safe deletion only after acknowledged writes. Do not silently upload a candidate, assume browser storage authenticates anyone, or remove the beta notice. Real concurrent/offline multi-tab and end-to-end tests remain required.

## Before release

1. A separate Neon test branch has Managed Better Auth enabled with shared email, OTP verification required and session revocation on password reset. Configure trusted origins and a strong server-only cookie secret for each environment; provision production only after the flow is tested. Keep the free plan.
2. Use the requested shared email provider for initial testing, with OTP verification and password reset. Neon recommends custom SMTP for production; shared delivery is limited, so clearly disclose this limitation and verify email delivery end to end. Do not add credentials to Git or screenshots.
3. Complete and test provider integration, signup/login/verification/recovery, secure identity-scoped cache partitioning, account switch handling, and explicit guest import. Update privacy disclosure. The initial UI has only been tested with mocked provider responses.
4. Test authenticated API isolation, CSRF, account switch across tabs, stale revisions, offline outbox, failed sync and guest migration; verify UI at mobile and desktop sizes. Use an isolated test database and test users.
5. **Owner approval gate:** Keep the PR in draft while work is incomplete. When ready, provide Kian a build/preview using the isolated test environment and clear steps for manual testing; ask Kian to test it before merge or deployment. Wait for explicit approval of that tested build. Do not merge or deploy to production before approval. After approval, coordinate the production migration, secrets and merge; the main branch deployment is automatic. Check production with isolated test accounts without altering real users' data. This is a documented/manual gate, not automated branch protection.
6. Do not add test commands to CI or the production build; run tests separately.

Reference: https://neon.com/docs/auth/production-checklist

## Repeatable local browser smoke test

With an isolated local app already running, manually run `VAZHE_QA_URL=http://127.0.0.1:3194 node scripts/qa/account-storage-ui.mjs` (set `CHROMIUM_PATH` if Playwright cannot find Chromium). It only permits localhost and intercepts authentication, dictionary and state requests; it never sends a real email. Optional `VAZHE_QA_SCREENSHOT_DIR` writes screenshots. This does not replace tests with the isolated real provider, multiple devices, or a screen reader, and it is not a CI/build step.
