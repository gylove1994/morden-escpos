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
| `pnpm --filter @workspace/server test` | Vitest (health, auth, tokens, billing/plan limits, enqueue/lease/report) |
| `pnpm --filter @workspace/server typecheck` | `tsc --noEmit` |

## Configuration

Development uses `APP_*` keys in `env.example.dev`. Non-development uses
unprefixed keys in `env.example.server`. Required auth secret:

- Dev: `APP_AUTH_SECRET` (min 32 chars)
- Server: `AUTH_SECRET` (min 32 chars)

`AUTH_SECRET` signs **human session** cookies (Better Auth). It is not a
Printer Agent device token.

### Stripe (cloud edition)

When `EDITION=cloud`, these are required (use [Stripe test mode](https://docs.stripe.com/test-mode) locally):

| Schema key | Dev (`APP_*`) | Purpose |
| ---------- | ------------- | ------- |
| `STRIPE_SECRET_KEY` | `APP_STRIPE_SECRET_KEY` | Stripe secret (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | `APP_STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) |
| `STRIPE_PRICE_PERSONAL` | `APP_STRIPE_PRICE_PERSONAL` | Personal plan Price id |
| `STRIPE_PRICE_BUSINESS` | `APP_STRIPE_PRICE_BUSINESS` | Business plan Price id |
| `BILLING_RESELLER_CONTACT_URL` | `APP_BILLING_RESELLER_CONTACT_URL` | Reseller contact CTA (default mailto) |

Self-hosted builds do not require Stripe variables. Point Stripe webhooks at
`POST /api/billing/webhook`.

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
- Cloud plan limits apply on create (`403` with `plan_limit_exceeded` when over quota)
- Protocol auth: Bearer device token on `/api/protocol/v1/*`
- owner/admin manage tokens; member may list only

## Cloud billing + plan limits

- Catalog: `GET /api/billing/plans` (Personal/Business checkoutable; Reseller contact-only)
- Checkout: `POST /api/billing/checkout` `{ "plan": "personal" | "business" }`
- Portal: `POST /api/billing/portal`
- Webhook sync: `POST /api/billing/webhook`
- Subscription summary: `GET /api/billing/subscription`
- Console UI: `/console/billing`
- Directional Personal quotas: 2 printers / 1 Printer Agent / 100 monthly jobs
- Directional Business quotas: 25 printers / 5 Printer Agents / 5000 monthly jobs
- Over-quota create/enqueue returns `403` with `error: "plan_limit_exceeded"`

## Printers + raw queue

- Console: `/console/printers` (create under a Printer Agent with connection hints)
- Console: `/console/jobs` (enqueue raw base64 ESC/POS + job history)
- APIs: `GET|POST /api/console/printers`, `GET|POST /api/console/jobs`
- Enqueue accepts optional `idempotencyKey` (dedupes per Organization)
- Protocol:
  - `POST /api/protocol/v1/jobs/lease` → `200 { job }` or `204`
  - `POST /api/protocol/v1/jobs/{jobId}/report` with
    `printing` → `succeeded` | `failed` (`errorMessage` required on failure)
- Job states: `queued` → `leased` → `printing` → `succeeded` | `failed`
- Expired leases return to `queued`
- Leased payloads include `payloadBase64`, `payloadByteLength`, and
  `connectionHints`

## Integrator API keys + webhook auth

- Console: `/console/integrator-auth` (create / list / revoke)
- APIs:
  - `GET|POST /api/console/api-keys`,
    `POST /api/console/api-keys/:apiKeyId/revoke`
  - `GET|POST /api/console/webhook-secrets`,
    `POST /api/console/webhook-secrets/:webhookSecretId/revoke`
- Enqueue surfaces (not human session cookies):
  - `POST /api/integrator/v1/jobs` with `Authorization: Bearer ik_…`
  - `POST /api/webhooks/v1/jobs` with `X-Webhook-Secret: whsec_…`
    **or** signed headers `X-Webhook-Id`, `X-Webhook-Timestamp`,
    `X-Webhook-Signature: sha256=<hmac>` over `${timestamp}.${rawBody}`
- owner/admin manage credentials; member may list only
- Credentials are kind-separated from Printer Agent device tokens (`pa_…`):
  cross-use is rejected with 401

## Edition stub

Set `EDITION=cloud` (default) or `EDITION=self-hosted` for the compile/build stub.
`next.config.ts` inlines the value; `lib/edition.ts` exposes helpers. Route
trimming is deferred.

## Print Queue Agent Protocol

OpenAPI: `contracts/print-queue-agent-protocol.openapi.yaml`.

Shared JSON fixtures for Printer Agent contract tests:
`contracts/fixtures/` (consumed by `apps/client-node`, later Go).

The server references and serves OpenAPI at `GET /api/protocol/openapi`.
Integration tests drive lease/report with an in-process fake Printer Agent.

Shared wire-format fixtures for Printer Agent clients live under
`contracts/fixtures/` (see that README). The Go Printer Agent
(`apps/client-go`) runs contract tests against them.

## Health

`GET /api/health` returns `{ status: "ok", edition, database: "up" }` when
Postgres is reachable.
