# Suppressions Resource — Design

## Goal

Add a `Suppression` resource to the Resend n8n node, exposing the new team-scoped
Suppression List API. A suppression list is the set of addresses Resend skips at send
time (hard bounces / spam complaints), protecting sender reputation.

Reference:
- Docs: https://resend.com/docs/api-reference/suppressions
- OpenAPI: https://github.com/resend/resend-openapi/blob/main/resend.yaml (`Suppressions` tag)

## API surface

| Operation    | HTTP                              | Inputs                                              | Notes |
|--------------|-----------------------------------|-----------------------------------------------------|-------|
| Create       | `POST /suppressions`              | `email` (required)                                  | 201 → `{ object, id }` |
| List         | `GET /suppressions`               | `origin` filter (`bounce`/`complaint`/`manual`), pagination | uses `limit`/`after`/`has_more` |
| Get          | `GET /suppressions/{suppression}` | suppression = ID **or** email                       | 200 → full record |
| Delete       | `DELETE /suppressions/{suppression}` | suppression = ID **or** email                    | 200 → `{ object, id, deleted }` |
| Batch Add    | `POST /suppressions/batch/add`    | `emails[]` (1–100)                                  | 201 → `{ data: [...] }` |
| Batch Remove | `POST /suppressions/batch/remove` | `emails[]` **or** `ids[]` (1–100, not both)         | 200 → `{ data: [...] }` |

Suppression record fields: `id`, `email`, `origin`, `source_id` (nullable), `created_at`.

## Structure

Mirror the existing `actions/broadcast/` resource layout. New directory
`nodes/Resend/actions/suppression/`:

- `index.ts` — operation dropdown + `descriptions` spread + exports
- `execute.ts` — `createOperationRouter` (item ops + `list` list-op)
- `create.operation.ts`
- `get.operation.ts`
- `delete.operation.ts`
- `list.operation.ts`
- `batchAdd.operation.ts`
- `batchRemove.operation.ts`

Resource key in router / node: `suppressions` (plural, matches existing convention).

## Field decisions

- **Get / Delete selector** — `createDynamicIdField` (resourceLocator): "From List"
  (dropdown of existing suppressions, name = email, value = id) + "By ID" manual entry.
  Manual mode accepts an ID or an email, since the path param does. Requires a new
  `getSuppressions` loadOptions/listSearch method and registration of `suppression`
  in `RESOURCE_METHOD_MAP` / `RESOURCE_DISPLAY_MAP`.
- **Batch Remove** — a `Remove By` options field (`emails` | `ids`) toggling which
  comma-separated input shows, enforcing the API's "one or the other" constraint.
- **Batch inputs** — comma-separated string parsed via existing `normalizeEmailList`.
- **List** — standard `returnAll` / `limit` (as in `contact/list`) plus optional
  `origin` options filter passed as `extraQs` to `requestList`.

## Reuse (no transport changes)

`apiRequest`, `requestList`, `createListExecutionData`, `createOperationRouter`,
`normalizeEmailList`, `createDynamicIdField` / `resolveDynamicIdValue`.

## Wiring

1. `actions/router.ts` — import `* as suppressions`, add to `resourceModules`.
2. `Resend.node.ts` — import module, add `Suppression` entry to the resource
   `options`, spread `...suppressions.descriptions`, register `getSuppressions` +
   `getSuppressionsListSearch` in `methods.loadOptions` / `methods.listSearch`.
3. `methods/index.ts` — add `getSuppressions` (name = email `(id)`, value = id) and
   `getSuppressionsListSearch`.
4. `dynamicFields.ts` — add `suppression` to `RESOURCE_METHOD_MAP` and
   `RESOURCE_DISPLAY_MAP`.

## Out of scope

No webhook/trigger changes (the `email.suppressed` webhook event already exists
independently). No transport-layer changes.

## Verification

`pnpm lint` and `pnpm build` must pass. Manual n8n load not required for CI.
