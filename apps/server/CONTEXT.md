# Context: bsl-saas (apps/server)

Primary SaaS context for the morden-escpos print-queue platform. License:
**BUSL-1.1** (see root `LICENSE` / `CONTEXT-MAP.md`). Change Date is four years
from publication; Change License is AGPL-3.0-or-later.

## Product

Operators enqueue print work from business systems; the control plane queues it
and delivers raw ESC/POS to physical printers through on-site **Printer Agents**.
Cloud edition adds billing and light tenant ops; self-hosted edition compiles
those surfaces out via the `EDITION` stub (`cloud` | `self-hosted`).

## Glossary

| Term | Meaning |
| ---- | ------- |
| **Printer Agent** | On-site print client process (Node or Go). MUST NOT be called a bare “Agent”. |
| **printerAgentId** | Stable identifier for a Printer Agent registration. |
| **device token** | Secret Bearer credential for Printer Agent protocol auth (`pa_…`). Shown once on create/rotate; stored hashed at rest. MUST stay distinct from human sessions, integrator API keys, and webhook secrets. |
| **integrator API key** | Secret Bearer credential for integrator REST enqueue (`ik_…`). Shown once on create; stored hashed at rest. MUST NOT authenticate the Print Queue Agent Protocol. |
| **webhook signing secret** | Secret for webhook enqueue (`whsec_…`). Auth via shared-secret header or HMAC-signed request. Shown once on create; stored hashed (+ encrypted for signature verify). MUST NOT authenticate device-token or API-key surfaces. |
| **Printer** | Confirmed physical device under exactly one Printer Agent. Jobs target a Printer (or later a Printer Group), never a bare Printer Agent. |
| **connection hints** | Transport + endpoint metadata (TCP / USB / Serial) stored on the Printer and copied onto leased job payloads. |
| **Print Queue Agent Protocol** | HTTP contract between the server and Printer Agents (OpenAPI under `contracts/`). Primary test seam. |
| **lease** | Exclusive claim on a job by a Printer Agent until completion or `leaseExpiresAt`. Expired leases return to `queued`. |
| **idempotency key** | Optional enqueue key unique per Organization; retries return the existing job. |
| **job status** | `queued` → `leased` → `printing` → `succeeded` \| `failed`. |
| **edition** | Build flavor: `cloud` or `self-hosted`. |
| **Organization** | Tenant that owns Printer Agents, printers, groups, jobs, and templates. |
| **Printer Group** | Fan-out target under exactly one Printer Agent (MVP; later ticket). |
| **human session auth** | Better Auth email/password sessions for console users (cookies). MUST stay distinct from Printer Agent device tokens. |
| **RBAC role** | Organization membership role: `owner`, `admin`, or `member`. |
| **Personal / Business** | Self-serve cloud plans via Stripe Checkout (~$1/mo / ~$5+/mo directional). |
| **Reseller** | Negotiated pricing path — contact CTA only, not self-serve Checkout. |
| **plan limits** | Numeric cloud quotas on printers, Printer Agents, and monthly jobs. |
| **print template** | Organization-scoped JSON `PrintJobJSON` definition. Rendered to raw ESC/POS at enqueue. |

## Auth boundaries

- Console operators authenticate with **human session auth** (Better Auth).
- Creating an Organization assigns the creator the **owner** role.
- At least one protected console/API action (Organization settings update) is
  gated so **owner/admin** MAY and **member** MUST NOT.
- **Printer Agent device tokens** authenticate the Print Queue Agent Protocol
  (`Authorization: Bearer pa_…`). They MUST NOT reuse session cookies, integrator
  API keys, or webhook secrets.
- Device tokens are stored as SHA-256 hashes; plaintext is returned only once on
  create or rotate. Revoked/rotated tokens MUST fail protocol auth.
- **Integrator API keys** authenticate `POST /api/integrator/v1/jobs`
  (`Authorization: Bearer ik_…`). owner/admin create/revoke; members MAY list.
- **Webhook signing secrets** authenticate `POST /api/webhooks/v1/jobs` via
  `X-Webhook-Secret` (shared secret) or `X-Webhook-Id` + `X-Webhook-Timestamp` +
  `X-Webhook-Signature: sha256=…` (HMAC over `${timestamp}.${rawBody}`).
- Integrator API keys / webhook secrets MUST NOT authenticate as device tokens
  (and vice versa). Unauthenticated or bad-signature enqueue is rejected (401).
- Members MAY enqueue raw or template jobs and list job history; only owner/admin
  MAY create Printers and manage Printer Agent tokens / integrator credentials /
  templates.

## Billing boundaries (cloud)

- Stripe Checkout is available for **Personal** and **Business** only.
- **Reseller** MUST remain a contact CTA (`reseller_contact_only`); no Checkout.
- Customer Portal manages payment methods / subscription after a Stripe customer exists.
- Plan limits reject over-quota printer create, Printer Agent create, and monthly
  job enqueue at the HTTP boundary (`plan_limit_exceeded`).

## Current slice

This package currently provides:

- Next.js app shell with `/api/health`
- Postgres + Drizzle migration wiring (auth, Organization, Printer Agent,
  billing, Printer, PrintJob, PrintTemplate tables)
- Better Auth email/password signup/login and Organization plugin
- Signed-in Organization console shell under `/console` (incl. Billing + Printer Agents)
- Printer Agent console management (`/console/printer-agents`) with create /
  list / revoke / rotate and cloud plan limits on create
- Printer console management (`/console/printers`) with connection hints
- Template CRUD (`/api/console/templates`) for stored JSON definitions
- Job enqueue + minimal job history (`/console/jobs`):
  - raw `payloadBase64`, or
  - `templateId + inputs` (server renders via MIT `morden-node-escpos/render`
    before the job is queued; leased payloads are raw ESC/POS only)
- Integrator auth console (`/console/integrator-auth`) for API keys + webhook secrets
- Integrator enqueue surfaces:
  - `POST /api/integrator/v1/jobs` (API key)
  - `POST /api/webhooks/v1/jobs` (shared secret or signed request)
- Device-token auth on Print Queue Agent Protocol:
  - `POST /api/protocol/v1/printer-agents/heartbeat`
  - `POST /api/protocol/v1/jobs/lease`
  - `POST /api/protocol/v1/jobs/{jobId}/report`
- Cloud Stripe Checkout / Customer Portal / webhook sync
- Plan-limit enforcement on Printer Agent create, Printer create, and job enqueue
- Exclusive lease with expiry requeue (`JOB_LEASE_MS`)
- Idempotent enqueue via `idempotencyKey`
- `EDITION` compile/build stub (no route trimming yet)
- Print Queue Agent Protocol OpenAPI, served at `/api/protocol/openapi`
- Shared protocol fixtures under `contracts/fixtures/v1/` for Printer Agent
  client contract tests (consumed by `apps/client-go`, `apps/client-node`)
- Vitest harness covering health, human-session auth, device-token lifecycle,
  billing HTTP boundaries, templates, and in-process fake Printer Agent queue tests

Out of scope here: Printer Groups, embedded template editor, discovery, landing,
self-hosted compile-out. Go/Node Printer Agent binaries live in
`apps/client-go` (#12) / `apps/client-node` (#6).
