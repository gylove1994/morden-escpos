# Context: bsl-saas (apps/client-go)

Go **Printer Agent** for the morden-escpos print-queue platform. License:
**BUSL-1.1** (see root `LICENSE` / `CONTEXT-MAP.md`).

## Product

An on-site process that authenticates with a Printer Agent device token, short-
polls the Print Queue Agent Protocol, leases raw ESC/POS jobs, prints them over
local transports (TCP / USB / Serial), and reports outcomes.

## Glossary

| Term | Meaning |
| ---- | ------- |
| **Printer Agent** | This on-site client process. MUST NOT be called a bare “Agent”. |
| **printerAgentId** | Stable id returned by heartbeat / carried on leased jobs. |
| **device token** | Bearer credential for protocol auth (`Authorization: Bearer …`). |
| **Print Queue Agent Protocol** | Shared HTTP contract (OpenAPI + fixtures under `apps/server/contracts/`). |
| **connection hints** | Transport endpoint metadata on leased jobs (`tcp` / `usb` / `serial`). |
| **lease** | Exclusive claim until completion or `leaseExpiresAt`. |

## Layout / license boundary

| Path | Role |
| ---- | ----- |
| `cmd/printer-agent` | BSL binary entrypoint |
| `internal/config` | Env/config loading (server URL + device token) |
| `internal/protocol` | Print Queue Agent Protocol HTTP client |
| `internal/agent` | Poll / lease / report / idle-backoff loop |
| `driver/` | **Driver-shaped** TCP / USB / Serial raw send. No protocol imports. Separable for a future MIT Go driver package extract; remains under BSL while it lives in this app path. |

## Shared contract tests

Fixtures live at `apps/server/contracts/fixtures/v1/`. Go contract tests load
those files so Node and Go Printer Agents stay aligned on wire format and state
transitions. Protocol seam tests MUST NOT require real printers.

## Out of scope here

Discovery UI (#7), Node Printer Agent implementation details (except shared
fixtures), template rendering.
