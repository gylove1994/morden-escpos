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

## Auth boundaries

- Console operators authenticate with **human session auth** (Better Auth).
- Creating an Organization assigns the creator the **owner** role.
- At least one protected console/API action (Organization settings update) is
  gated so **owner/admin** MAY and **member** MUST NOT.
- **Printer Agent device tokens** authenticate the Print Queue Agent Protocol
  (`Authorization: Bearer …`). They MUST NOT reuse session cookies.
- Device tokens are stored as SHA-256 hashes; plaintext is returned only once on
  create or rotate. Revoked/rotated tokens MUST fail protocol auth.
- Members MAY enqueue raw jobs and list job history; only owner/admin MAY create
  Printers and manage Printer Agent tokens.

## Current slice

This package currently provides:

- Next.js app shell with `/api/health`
- Postgres + Drizzle migration wiring (auth, Organization, Printer Agent,
  Printer, PrintJob tables)
- Better Auth email/password signup/login and Organization plugin
- Signed-in Organization console shell under `/console`
- Printer Agent console management (`/console/printer-agents`) with create /
  list / revoke / rotate
- Printer console management (`/console/printers`) with connection hints
- Raw job enqueue + minimal job history (`/console/jobs`)
- Device-token auth on Print Queue Agent Protocol:
  - `POST /api/protocol/v1/printer-agents/heartbeat`
  - `POST /api/protocol/v1/jobs/lease`
  - `POST /api/protocol/v1/jobs/{jobId}/report`
- Exclusive lease with expiry requeue (`JOB_LEASE_MS`)
- Idempotent enqueue via `idempotencyKey`
- `EDITION` compile/build stub (no route trimming yet)
- Print Queue Agent Protocol OpenAPI, served at `/api/protocol/openapi`
- Vitest harness with an in-process fake Printer Agent at the HTTP protocol seam

Out of scope here: Printer Groups, templates, Node/Go agents, discovery,
integrator API keys, billing.
