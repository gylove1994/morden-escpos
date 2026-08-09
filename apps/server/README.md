# @workspace/server

BSL SaaS print-queue control plane. See [`CONTEXT.md`](./CONTEXT.md).

## Requirements

- Node.js 22+
- pnpm 10.x
- PostgreSQL 16+ (local URL defaults are in `env.example.dev`)

## Scripts

| Command | Purpose |
| ------- | ------- |
| `pnpm --filter @workspace/server dev` | Next.js dev server (port 43128) via dotenvx + `env.example.dev` |
| `pnpm --filter @workspace/server build` | Production build |
| `pnpm --filter @workspace/server db:generate` | Generate Drizzle migrations from `lib/db/schema.ts` |
| `pnpm --filter @workspace/server db:migrate` | Apply migrations |
| `pnpm --filter @workspace/server test` | Vitest (health, auth, tokens, enqueue/lease/report) |
| `pnpm --filter @workspace/server typecheck` | `tsc --noEmit` |

## Configuration

Development uses `APP_*` keys in `env.example.dev`. Non-development uses
unprefixed keys in `env.example.server`. Required auth secret:

- Dev: `APP_AUTH_SECRET` (min 32 chars)
- Server: `AUTH_SECRET` (min 32 chars)

`AUTH_SECRET` signs **human session** cookies (Better Auth). It is not a
Printer Agent device token.

Optional lease duration:

- Dev: `APP_JOB_LEASE_MS` (default `30000`)
- Server: `JOB_LEASE_MS` (default `30000`)

## Human session auth + Organization RBAC

- Signup / login: `/signup`, `/login` → Better Auth at `/api/auth/*`
- Create Organization (creator becomes **owner**): `/console/create-organization`
- Signed-in Organization shell: `/console`
- Roles: `owner` | `admin` | `member`
- Protected example: `PATCH /api/console/org-settings` requires owner/admin
- Session probe: `GET /api/console/session` (401 without a session cookie)

## Printer Agents + device tokens

- Console: `/console/printer-agents` (list / create / revoke / rotate)
- APIs: `GET|POST /api/console/printer-agents`,
  `POST /api/console/printer-agents/:printerAgentId/revoke|rotate`
- Create and rotate return the plaintext device token **once**; DB stores SHA-256
- Protocol auth: Bearer device token on `/api/protocol/v1/*`
- owner/admin manage tokens; member may list only

## Printers + Printer Groups + templates + queue

- Console: `/console/printers` (create under a Printer Agent with connection hints)
- Console: `/console/printer-groups` (fan-out target under exactly one Printer Agent)
- Console: `/console/templates` (CRUD + embedded MIT Receipt Studio editor)
- Console: `/console/jobs` (enqueue + job history + child retry)
- APIs:
  - `GET|POST /api/console/printers`
  - `GET|POST /api/console/printer-groups`,
    `PATCH /api/console/printer-groups/:printerGroupId`
  - `GET|POST /api/console/templates`,
    `GET|PATCH|DELETE /api/console/templates/:templateId`
    (owner/admin mutate; members may list)
  - `GET|POST /api/console/jobs` (exactly one of `printerId` or `printerGroupId`)
  - `POST /api/console/jobs/:jobId/retry` (failed child only)
- Enqueue body is either:
  - raw: `{ printerId|printerGroupId, payloadBase64, idempotencyKey?, purpose? }`, or
  - template: `{ printerId|printerGroupId, templateId, inputs, idempotencyKey?, purpose? }`
- Template enqueue renders to raw ESC/POS on the server (MIT
  `morden-node-escpos/render`) before the job is queued; invalid templates/inputs
  fail at enqueue with `400`
- Embedded editor confirmation prints use `purpose: "template_confirmation"` and
  require a Printer or Printer Group target before submit
- Enqueue accepts optional `idempotencyKey` (dedupes per Organization)
- Group enqueue creates one parent + N child jobs sharing `parentJobId`
- Parent succeeds only when every child succeeds; mixed results → `partial_failed`
- Empty / unknown Printer Group enqueue returns a clear error
- Protocol:
  - `POST /api/protocol/v1/jobs/lease` → `200 { job }` or `204`
  - `POST /api/protocol/v1/jobs/{jobId}/report` with
    `printing` → `succeeded` | `failed` (`errorMessage` required on failure)
- Job states (single/child): `queued` → `leased` → `printing` → `succeeded` | `failed`
- Parent states: `queued` while children run → `succeeded` | `partial_failed` | `failed`
- Expired leases return to `queued`
- Leased payloads include `payloadBase64`, `payloadByteLength`, and
  `connectionHints` (raw bytes only — never template JSON)

## Edition stub

Set `EDITION=cloud` (default) or `EDITION=self-hosted` for the compile/build stub.
`next.config.ts` inlines the value; `lib/edition.ts` exposes helpers. Route
trimming is deferred.

## Print Queue Agent Protocol

OpenAPI: `contracts/print-queue-agent-protocol.openapi.yaml`.

The server references and serves it at `GET /api/protocol/openapi`.
Integration tests drive lease/report with an in-process fake Printer Agent.

## Health

`GET /api/health` returns `{ status: "ok", edition, database: "up" }` when
Postgres is reachable.
