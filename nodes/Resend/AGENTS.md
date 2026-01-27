# AGENTS.md

## Package Identity

- Resend action node and webhook trigger for n8n
- Tech: TypeScript + n8n-workflow node APIs

## Setup & Run

- Install deps: `npm install`
- Build: `npm run build`
- Dev watch: `npm run dev`
- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`
- Format: `npm run format`
- Tests: not configured

## Patterns & Conventions

- DO: Keep the main node description and properties in `nodes/Resend/Resend.node.ts`.
- DO: Ensure `description` includes core fields (`displayName`, `name`, `icon`, `group`, `version`, `description`, `defaults`, `inputs`, `outputs`, `credentials`) as shown in `nodes/Resend/Resend.node.ts`.
- DO: Implement resource/operation logic in the `execute` flow in `nodes/Resend/Resend.node.ts`.
- DO: Use `displayOptions` to scope fields per resource/operation like in `nodes/Resend/Resend.node.ts`.
- DO: Use `this.helpers.httpRequest` for Resend API calls as in `nodes/Resend/Resend.node.ts`.
- DO: Throw `NodeOperationError` for validation failures like in `nodes/Resend/Resend.node.ts`.
- DO: Keep webhook signature verification in `nodes/Resend/ResendTrigger.node.ts`.
- DO: Reference SVG icons from this folder, e.g. `nodes/Resend/resend-icon-white.svg`.
- DO: Keep webhook config in `nodes/Resend/ResendTrigger.node.ts` with `isFullPath: true`.
- DON'T: Update the legacy node implementation in `_audit/actuallyzefe-n8n-nodes-resend/nodes/Resend/Resend.node.ts`.
- DON'T: Revive `_audit/actuallyzefe-n8n-nodes-resend/nodes/Resend/Resend.node.json`; it is archived only.

## Touch Points / Key Files

- Action node: `nodes/Resend/Resend.node.ts`
- Trigger node: `nodes/Resend/ResendTrigger.node.ts`
- Icons: `nodes/Resend/resend-icon-white.svg`
- Icons: `nodes/Resend/resend-icon-black.svg`
- Credential used: `credentials/ResendApi.credentials.ts`
- n8n node registration: `package.json`

## JIT Index Hints

- Find resources/options: `rg -n "resource" nodes/Resend/Resend.node.ts`
- Find operations: `rg -n "operation" nodes/Resend/Resend.node.ts`
- Find API requests: `rg -n "helpers.httpRequest" nodes/Resend/Resend.node.ts`
- Find error guards: `rg -n "NodeOperationError" nodes/Resend/Resend.node.ts`
- Find webhook handling: `rg -n "webhook" nodes/Resend/ResendTrigger.node.ts`
- Find signature verification: `rg -n "verifySvixSignature" nodes/Resend/ResendTrigger.node.ts`

## Common Gotchas

- Attachments cannot be used with scheduled emails (guarded in `nodes/Resend/Resend.node.ts`).
- Webhook verification expects `svix-*` headers; missing headers are ignored.
- The `path` parameter is full path (`isFullPath: true`), so it replaces the UUID segment.

## Pre-PR Checks

- `npm run lint && npm run build`
