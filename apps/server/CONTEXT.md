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
| **Print Queue Agent Protocol** | HTTP contract between the server and Printer Agents (OpenAPI under `contracts/`). Primary test seam. |
| **edition** | Build flavor: `cloud` or `self-hosted`. |
| **Organization** | Tenant that owns Printer Agents, printers, groups, jobs, and templates. |
| **Printer Group** | Fan-out target under exactly one Printer Agent (MVP). |

## Scaffold boundaries

This package currently provides:

- Next.js app shell with `/api/health`
- Postgres + Drizzle migration wiring
- `EDITION` compile/build stub (no route trimming yet)
- Print Queue Agent Protocol OpenAPI skeleton, served at `/api/protocol/openapi`
- Vitest harness that boots the server for future protocol tests

Out of scope here: org signup/RBAC, Printer Agent registration, job
enqueue/lease/report, client agents, landing, billing.
