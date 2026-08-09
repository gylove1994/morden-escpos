# Print Queue Agent Protocol fixtures

Shared wire-format fixtures for the **Print Queue Agent Protocol** (`../print-queue-agent-protocol.openapi.yaml`).

These fixtures are the contract seam for Printer Agent clients:

- `apps/client-go` — Go Printer Agent (#12)
- `apps/client-node` — Node Printer Agent (#6)

Clients MUST NOT invent divergent request/response shapes. Contract tests in each
Printer Agent SHOULD load fixtures from `v1/` and assert encoding, decoding, and
status transitions against them.

## Layout

| Path | Purpose |
| ---- | ------- |
| `v1/scenarios.json` | Ordered scenarios (heartbeat, lease, report, failures) |
| `v1/*.response.json` | HTTP response bodies |
| `v1/*.request.json` | HTTP request bodies |
| `v1/*.meta.json` | Non-body metadata (e.g. HTTP 204 empty lease) |

Placeholders:

- `${deviceToken}` — Printer Agent device token (Bearer)
- `${jobId}` — leased job id
- `${printerAgentId}` / `${organizationId}` / `${printerId}` — stable ids

## Naming

Use **Printer Agent** / `printerAgentId` in fixture descriptions and field names.
Do not use bare `agent` for this concept.
