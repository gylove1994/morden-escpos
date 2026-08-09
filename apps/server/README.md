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
| `pnpm --filter @workspace/server build` | Production cloud build (`env.example.server`) |
| `pnpm --filter @workspace/server build:self-hosted` | Production self-hosted build (omits cloud-only routes) |
| `pnpm --filter @workspace/server db:generate` | Generate Drizzle migrations from `lib/db/schema.ts` |
| `pnpm --filter @workspace/server db:migrate` | Apply migrations |
| `pnpm --filter @workspace/server test` | Vitest (health, auth, tokens, billing, queue, platform, compile-out, discovery) |
| `pnpm --filter @workspace/server typecheck` | `tsc --noEmit` |

## Configuration

Development uses `APP_*` keys in `env.example.dev`. Non-development uses
unprefixed keys in `env.example.server` (cloud) or `env.example.self-hosted`.
Required auth secret:

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
| `PLATFORM_ADMIN_SECRET` | `APP_PLATFORM_ADMIN_SECRET` | Bearer secret for platform tenant-ops (min 32 chars) |

Self-hosted builds do not require Stripe or platform-admin variables. Point Stripe
webhooks at `POST /api/billing/webhook` on cloud deployments only.

Optional lease / presence:

- Dev: `APP_JOB_LEASE_MS` (default `30000`)
- Server: `JOB_LEASE_MS` (default `30000`)
- Dev: `APP_PRINTER_AGENT_ONLINE_WINDOW_MS` (default `60000`)
- Server: `PRINTER_AGENT_ONLINE_WINDOW_MS` (default `60000`)

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

## Printers + discovery + raw queue

- Console: `/console/printers` (confirm discoveries, create, disable; shows
  owning Printer Agent + online/offline)
- Console: `/console/jobs` (enqueue raw base64 ESC/POS + auditable job history)
- APIs: `GET|POST /api/console/printers`,
  `POST /api/console/printers/:printerId/disable`,
  `GET /api/console/discoveries`,
  `POST /api/console/discoveries/:discoveryId/confirm`,
  `GET|POST /api/console/jobs`
- Disable keeps the Printer row and job history; new enqueue is rejected
- Enqueue accepts optional `idempotencyKey` (dedupes per Organization)
- Enqueue also accepts optional history hooks:
  - `kind`: `raw` (default) or `template_confirmation`
  - `parentJobId`: links a child job for group fan-out display
- History list returns truthful `status` / `errorMessage`, plus `kind`,
  `parentJobId`, `childCount`, and `relation` (`standalone` | `parent` | `child`)
- Protocol:
  - `POST /api/protocol/v1/printer-agents/discoveries` → upsert endpoints
  - `POST /api/protocol/v1/jobs/lease` → `200 { job }` or `204`
  - `POST /api/protocol/v1/jobs/{jobId}/report` with
    `printing` → `succeeded` | `failed` (`errorMessage` required on failure)
- Job states: `queued` → `leased` → `printing` → `succeeded` | `failed`
- Expired leases return to `queued`
- Leased payloads include `payloadBase64`, `payloadByteLength`, and
  `connectionHints`

## Console i18n (zh / en)

- Cookie: `console_locale=en|zh` (default `en`; no other locales in MVP)
- Locale switcher in auth pages and the console shell
- Message catalogs live under `lib/i18n/`

## Platform tenant ops (cloud)

- Lookup: `GET /api/platform/organizations?q=<id|slug|name>`
- Ban / suspend / restore: `PATCH /api/platform/organizations/:id/status`
  with `{ "status": "active" | "suspended" | "banned" }`
- Auth header: `Authorization: Bearer <PLATFORM_ADMIN_SECRET>`
- Console UI: `/console/platform`
- Suspended/banned Organizations receive `403 organization_inactive` on console mutations

## Edition compile-out

Set `EDITION=cloud` (default) or `EDITION=self-hosted`.

`next.config.ts` inlines the value and sets `pageExtensions`:

- Cloud: includes `cloud.ts` / `cloud.tsx` so `route.cloud.ts` / `page.cloud.tsx` ship
- Self-hosted: default extensions only — `*.cloud.ts(x)` App Router entries are **absent**

Cloud-only surfaces today:

- `/api/billing/*`, `/console/billing`
- `/api/platform/*`, `/console/platform`

Self-hosted keeps org users, Printer Agents, printers, jobs, and templates paths.
Acceptance tests assert both filesystem discovery and the self-hosted
`.next/server/app-paths-manifest.json` omit cloud-only routes.

## Print Queue Agent Protocol

OpenAPI: `contracts/print-queue-agent-protocol.openapi.yaml`.

The server references and serves it at `GET /api/protocol/openapi`.
Integration tests drive lease/report with an in-process fake Printer Agent.

## Health

`GET /api/health` returns `{ status: "ok", edition, database: "up" }` when
Postgres is reachable.
