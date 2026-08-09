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
| **device token** | Secret Bearer credential for Printer Agent protocol auth. Shown once on create/rotate; stored hashed at rest. MUST stay distinct from human sessions and future integrator API keys. |
| **Printer** | Confirmed physical device under exactly one Printer Agent. Jobs target a Printer or a Printer Group, never a bare Printer Agent. |
| **connection hints** | Transport + endpoint metadata (TCP / USB / Serial) stored on the Printer and copied onto leased job payloads. |
| **Print Queue Agent Protocol** | HTTP contract between the server and Printer Agents (OpenAPI under `contracts/`). Primary test seam. |
| **lease** | Exclusive claim on a job by a Printer Agent until completion or `leaseExpiresAt`. Expired leases return to `queued`. Parent aggregation jobs are never leased. |
| **idempotency key** | Optional enqueue key unique per Organization; retries return the existing job (parent + children for group enqueue). |
| **job kind** | `single` (one Printer), `parent` (group aggregation), or `child` (one fan-out copy). |
| **job purpose** | `standard` or `template_confirmation` (embedded-editor confirmation prints, labeled in job history). |
| **job status** | Child/single: `queued` → `leased` → `printing` → `succeeded` \| `failed`. Parent: `queued` while children run, then `succeeded` \| `partial_failed` \| `failed`. |
| **edition** | Build flavor: `cloud` or `self-hosted`. |
| **Organization** | Tenant that owns Printer Agents, printers, groups, jobs, and templates. |
| **Printer Group** | Fan-out target under exactly one Printer Agent. Membership is a set of Printers on that same Printer Agent. |
| **parent job** | Aggregation job created when enqueueing to a Printer Group. Succeeds only when every child succeeds. |
| **child job** | One leased print targeting a single Printer; shares `parentJobId` with siblings. Failed children MAY be retried without reprinting successful siblings. |
| **human session auth** | Better Auth email/password sessions for console users (cookies). MUST stay distinct from Printer Agent device tokens. |
| **RBAC role** | Organization membership role: `owner`, `admin`, or `member`. |
| **print template** | Organization-scoped JSON `PrintJobJSON` definition. Rendered to raw ESC/POS at enqueue. |

## Auth boundaries

- Console operators authenticate with **human session auth** (Better Auth).
- Creating an Organization assigns the creator the **owner** role.
- At least one protected console/API action (Organization settings update) is
  gated so **owner/admin** MAY and **member** MUST NOT.
- **Printer Agent device tokens** authenticate the Print Queue Agent Protocol
  (`Authorization: Bearer …`). They MUST NOT reuse session cookies.
- Device tokens are stored as SHA-256 hashes; plaintext is returned only once on
  create or rotate. Revoked/rotated tokens MUST fail protocol auth.
- Members MAY enqueue raw or template jobs and list job history; only owner/admin
  MAY create Printers, manage Printer Groups, manage Printer Agent tokens, and
  mutate templates.

## Current slice

This package currently provides:

- Next.js app shell with `/api/health`
- Postgres + Drizzle migration wiring (auth, Organization, Printer Agent,
  Printer, Printer Group, PrintJob, PrintTemplate tables)
- Better Auth email/password signup/login and Organization plugin
- Signed-in Organization console shell under `/console`
- Printer Agent console management (`/console/printer-agents`) with create /
  list / revoke / rotate
- Printer console management (`/console/printers`) with connection hints
- Printer Group console management (`/console/printer-groups`) under one
  Printer Agent
- Template CRUD + embedded MIT template editor (`/console/templates`) for
  stored JSON definitions; in-browser preview stays in the MIT editor (local)
- Job enqueue + minimal job history (`/console/jobs`):
  - raw `payloadBase64`, or
  - `templateId + inputs` (server renders via MIT `morden-node-escpos/render`
    before the job is queued; leased payloads are raw ESC/POS only)
  - Printer or Printer Group targets; failed child retry at
    `POST /api/console/jobs/{jobId}/retry`
  - `purpose: template_confirmation` labels confirmation prints from the
    embedded editor
- Device-token auth on Print Queue Agent Protocol:
  - `POST /api/protocol/v1/printer-agents/heartbeat`
  - `POST /api/protocol/v1/jobs/lease`
  - `POST /api/protocol/v1/jobs/{jobId}/report`
- Exclusive lease with expiry requeue (`JOB_LEASE_MS`)
- Group fan-out: parent + N children; parent aggregates to
  `succeeded` / `partial_failed` / `failed`
- Idempotent enqueue via `idempotencyKey`
- `EDITION` compile/build stub (no route trimming yet)
- Print Queue Agent Protocol OpenAPI, served at `/api/protocol/openapi`
- Vitest harness with an in-process fake Printer Agent at the HTTP protocol seam

Out of scope here: Node/Go agents, discovery, integrator API keys, billing,
i18n polish.
