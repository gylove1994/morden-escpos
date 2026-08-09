# Context: bsl-saas (apps/client-node)

Node **Printer Agent** for the morden-escpos print-queue platform. License:
**BUSL-1.1** (see root `LICENSE` / `CONTEXT-MAP.md`).

## Product

An on-site process that authenticates with a **device token**, short-polls the
Print Queue Agent Protocol, leases raw ESC/POS jobs, prints them to local
printers (TCP / USB / Serial), and reports outcomes. This package is the Node
implementation.

## Glossary

| Term | Meaning |
| ---- | ------- |
| **Printer Agent** | This on-site client process. MUST NOT be called a bare “Agent”. |
| **printerAgentId** | Stable identifier returned by heartbeat / carried on leased jobs. |
| **device token** | Bearer credential for protocol auth (`Authorization: Bearer …`). |
| **lease** | Exclusive claim on a job until completion or `leaseExpiresAt`. |
| **connection hints** | Transport + endpoint metadata on the leased job (`tcp` / `usb` / `serial`). |
| **idle backoff** | Exponential delay applied when lease returns 204 (no work). |

## Current slice (#13 transports on top of #6)

- Configurable `SERVER_URL` + `DEVICE_TOKEN` via env and optional JSON config file
- Heartbeat, short-poll lease, report (`printing` → `succeeded` \| `failed`)
- Idle backoff when no work
- TCP / USB / Serial print of leased raw bytes via MIT adapters
  (`NetworkAdapter`, `DevicePathAdapter`, `SerialAdapter`)
- Contract tests against shared fixtures under
  `apps/server/contracts/fixtures/v1/`
- Thin adapter tests (temp files / TCP loopback); see `TRANSPORT-CHECKLIST.md`
  for real hardware

## Out of scope here

Discovery UI (#7), groups/templates.
