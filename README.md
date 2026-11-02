# Ask RESPOND Pro — Sandbox / partner preview

**Release HOLD — proposed access-code-gated candidate, not a public anonymous deployment.**
This branch depends on the security/error-handling candidate in [PR #2](https://github.com/Daddymac1969/ask-respond-sandbox/pull/2). The previous README described an anonymous demo, but the existing browser required an access code while the chat backend accepted requests without any session. This candidate **chooses a server-enforced, code-gated preview** for human product-owner review. Do not merge until the intended audience and access contract are approved.

## What this candidate does

- The browser checks a sandbox evaluator access code through `/.netlify/functions/auth` and receives a 30-minute signed bearer token.
- All calls to `/.netlify/functions/chat` require a **valid server-verified token** before document retrieval or a chargeable Anthropic API request.
- The token stays in browser memory only. Page reload, expiry or server rejection requires a new login; the old browser-only `sessionStorage` login flags cannot grant access.
- Requests and AI outputs are for synthetic demonstrations only; this is **not** a monitored safeguarding service, clinical service, official record system or live-case tool.
- The earlier technical draft bounds requests and errors and escapes streaming content. This does not imply distributed rate limiting or model safety approval.

## Required Netlify configuration — server-side only

- `SANDBOX_SESSION_SECRET`: independent unpredictable signing secret, at least 32 UTF-8 bytes, **required**. The login fails closed when absent. Rotate it to revoke outstanding sessions.
- `ACCESS_CODE_1` through `ACCESS_CODE_10`: at least one configured evaluator code; required. Codes must be distributed outside GitHub.
- `ANTHROPIC_API_KEY`: required for authenticated model responses.
- Optional `DOC_INDEX_PATH`, `MAX_HISTORY_TURNS`, `MAX_EXCERPTS` are inherited from the existing handler.

Do not write any of the above values to source, CI or audit logs. Configure platform-level abuse protection and spend limits separately; 30-minute signed sessions do **not** stop an authorised evaluator from making costly requests.

## Known release blockers

1. Product owner: choose **anonymous public demo** *or* **restricted code-gated preview**. The two models must not be advertised simultaneously. This draft implements the second option and deliberately does not provide a guest bypass.
2. IT: verify endpoint protection, signing secret and codes on the correct Netlify site, session expiry, browser flows, budgets, throttling, rollback and deployed handler path. The repository alone does not prove production deployment.
3. DSL/legal: existing sandbox system prompt inaccurately describes a blanket reporting duty under a 2025 Act and incorrectly ranks RESPOND over law/statute. The optional README-era source index cites KCSIE 2025/Working Together 2023. No statutory wording has been approved or altered in this branch.
4. DPO: verify provider processing, retention, lawful purposes, privacy notice and handling of inadvertently entered identifiable data. The present privacy notice is a historical document and needs owner sign-off.
5. Safeguarding/product acceptance: synthetic-only negative security, urgent-case, citation, accessibility and cross-browser checks; record named approvers. A green CI or deploy preview is **not** approval to use with real cases.

## Offline verification

The existing `tests/sandbox-handler.test.js` exercises request bounds and safe rendering, and this branch adds signed-session, login and unauthorised-request checks. Run `node --test tests/sandbox-handler.test.js` with synthetic fixtures. The GitHub workflow on the draft PR runs syntax and those tests. No live Anthropic call is required.

## Scope

The Netlify configuration selects `netlify/functions/`, not the historical root-level `chat.js` and `auth.js` copies. No actual authentication credentials, student records or case histories belong in this repository. Separate product-owner, IT, DSL, DPO and statutory approval are mandatory before merging/deploying.
