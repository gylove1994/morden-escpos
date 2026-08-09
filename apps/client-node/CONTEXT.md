# Context: bsl-saas (apps/client-node)

Node **Printer Agent** for the morden-escpos print-queue platform. License:
**BUSL-1.1** (see root `LICENSE` / `CONTEXT-MAP.md`).

## Product

An on-site process that authenticates with a **device token**, short-polls the
Print Queue Agent Protocol, leases raw ESC/POS jobs, prints them to local
printers, and reports outcomes. This package is the Node implementation.

## Glossary

| Term | Meaning |
| ---- | ------- |
| **Printer Agent** | This on-site client process. MUST NOT be called a bare “Agent”. |
| **printerAgentId** | Stable identifier returned by heartbeat / carried on leased jobs. |
| **device token** | Bearer credential for protocol auth (`Authorization: Bearer …`). |
| **lease** | Exclusive claim on a job until completion or `leaseExpiresAt`. |
| **connection hints** | Transport + endpoint metadata on the leased job (TCP in this slice). |
| **idle backoff** | Exponential delay applied when lease returns 204 (no work). |

## Current slice (#6)

- Configurable `SERVER_URL` + `DEVICE_TOKEN` via env and optional JSON config file
- Heartbeat, short-poll lease, report (`printing` → `succeeded` \| `failed`)
- Idle backoff when no work
- TCP print of leased raw bytes via MIT `NetworkAdapter` / `Printer`
- Contract tests against shared fixtures under
  `apps/server/contracts/fixtures/`

## Out of scope here

USB/Serial (#13), discovery (#7), Go client (#12), groups/templates.
