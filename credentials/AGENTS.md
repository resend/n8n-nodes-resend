# AGENTS.md

## Package Identity
- Defines the Resend API credential used by the nodes
- Tech: TypeScript + n8n-workflow credential interfaces

## Setup & Run
- Install deps: `npm install`
- Build: `npm run build`
- Dev watch: `npm run dev`
- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`
- Format: `npm run format`
- Tests: not configured

## Patterns & Conventions
- DO: Follow the credential class pattern in `credentials/ResendApi.credentials.ts`.
- DO: Keep `name = 'resendApi'` aligned with `nodes/Resend/Resend.node.ts`.
- DO: Use `typeOptions: { password: true }` for secrets as in `credentials/ResendApi.credentials.ts`.
- DO: Provide `authenticate` headers like `credentials/ResendApi.credentials.ts`.
- DO: Provide a `test` request like `credentials/ResendApi.credentials.ts` to validate keys.
- DO: Keep `documentationUrl` current in `credentials/ResendApi.credentials.ts`.
- DO: Add new credential files under `credentials/` with `*.credentials.ts` naming (see `credentials/ResendApi.credentials.ts`).
- DO: Update `package.json` `n8n.credentials` when adding new credentials (see `package.json`).
- DON'T: Edit archived credential code in `_audit/actuallyzefe-n8n-nodes-resend/credentials/ResendApi.credentials.ts`.
- DO: Keep formatting consistent with tabs as shown in `credentials/ResendApi.credentials.ts`.

## Touch Points / Key Files
- Credential definition: `credentials/ResendApi.credentials.ts`
- Node reference to credential name: `nodes/Resend/Resend.node.ts`
- n8n credential registration: `package.json`

## JIT Index Hints
- Find credential classes: `rg -n "ICredentialType" credentials`
- Find auth headers: `rg -n "authenticate" credentials/ResendApi.credentials.ts`
- Find credential tests: `rg -n "test:" credentials/ResendApi.credentials.ts`
- Find docs links: `rg -n "documentationUrl" credentials/ResendApi.credentials.ts`
- Find n8n credential registration: `rg -n "\"credentials\"" package.json`

## Common Gotchas
- The credential `name` must stay `resendApi` to match `nodes/Resend/Resend.node.ts`.
- `authenticate` and `test` are required by n8n ESLint rules; lint fails if missing.
- Credential filenames must end in `.credentials.ts` to satisfy n8n ESLint rules.

## Pre-PR Checks
- `npm run lint && npm run build`
