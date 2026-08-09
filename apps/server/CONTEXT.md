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
| **Print Queue Agent Protocol** | HTTP contract between the server and Printer Agents (OpenAPI under `contracts/`). Primary test seam. |
| **edition** | Build flavor: `cloud` or `self-hosted`. |
| **Organization** | Tenant that owns Printer Agents, printers, groups, jobs, and templates. |
| **Printer Group** | Fan-out target under exactly one Printer Agent (MVP). |
| **human session auth** | Better Auth email/password sessions for console users (cookies). MUST stay distinct from Printer Agent device tokens. |
| **RBAC role** | Organization membership role: `owner`, `admin`, or `member`. |
| **Personal / Business** | Self-serve cloud plans via Stripe Checkout (~$1/mo / ~$5+/mo directional). |
| **Reseller** | Negotiated pricing path — contact CTA only, not self-serve Checkout. |
| **plan limits** | Numeric cloud quotas on printers, Printer Agents, and monthly jobs. |

## Auth boundaries

- Console operators authenticate with **human session auth** (Better Auth).
- Creating an Organization assigns the creator the **owner** role.
- At least one protected console/API action (Organization settings update) is
  gated so **owner/admin** MAY and **member** MUST NOT.
- **Printer Agent device tokens** authenticate the Print Queue Agent Protocol
  (`Authorization: Bearer …`). They MUST NOT reuse session cookies.
- Device tokens are stored as SHA-256 hashes; plaintext is returned only once on
  create or rotate. Revoked/rotated tokens MUST fail protocol auth.

## Billing boundaries (cloud)

- Stripe Checkout is available for **Personal** and **Business** only.
- **Reseller** MUST remain a contact CTA (`reseller_contact_only`); no Checkout.
- Customer Portal manages payment methods / subscription after a Stripe customer exists.
- Plan limits reject over-quota printer create, Printer Agent create, and monthly
  job enqueue at the HTTP boundary (`plan_limit_exceeded`).
- Printer create and monthly job enqueue remain thin stub routes (`stub: true`) until
  #5 owns full printer inventory and job lifecycle.

## Current slice

This package currently provides:

- Next.js app shell with `/api/health`
- Postgres + Drizzle migration wiring (auth, Organization, Printer Agent, billing tables)
- Better Auth email/password signup/login and Organization plugin
- Signed-in Organization console shell under `/console` (incl. Billing + Printer Agents)
- Printer Agent console management (`/console/printer-agents`) with create /
  list / revoke / rotate and cloud plan limits on create
- Device-token auth on `POST /api/protocol/v1/printer-agents/heartbeat`
- Cloud Stripe Checkout / Customer Portal / webhook sync
- Plan-limit enforcement on Printer Agent create, printer stub create, and job enqueue
- `EDITION` compile/build stub (no route trimming yet)
- Print Queue Agent Protocol OpenAPI, served at `/api/protocol/openapi`
- Vitest harness covering health, human-session auth, device-token lifecycle, and billing HTTP boundaries

Out of scope here: full job enqueue/lease/report (#5), discovery, Node/Go clients, landing, self-hosted compile-out.
