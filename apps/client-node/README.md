# @workspace/client-node

Node **Printer Agent**: short-poll the Print Queue Agent Protocol, lease raw
ESC/POS jobs, print over TCP / USB / Serial via the MIT `morden-node-escpos`
stack, and report outcomes.

## Requirements

- Node.js 22+
- pnpm 10.x
- A registered Printer Agent device token from the SaaS console

## Scripts

| Command | Purpose |
| ------- | ------- |
| `pnpm --filter @workspace/client-node dev` | Run with `env.example.dev` via dotenvx |
| `pnpm --filter @workspace/client-node build` | Compile to `dist/` |
| `pnpm --filter @workspace/client-node start` | Run compiled agent with `env.example.server` |
| `pnpm --filter @workspace/client-node test` | Vitest (contract, backoff, transports, loop) |
| `pnpm --filter @workspace/client-node typecheck` | `tsc --noEmit` |

## Configuration

Development uses `APP_*` keys in `env.example.dev`. Non-development uses
unprefixed keys in `env.example.server`.

| Key | Meaning |
| --- | ------- |
| `SERVER_URL` | Control plane base URL (e.g. `http://127.0.0.1:43128`) |
| `DEVICE_TOKEN` | Printer Agent device token (required secret) |
| `CONFIG_FILE` | Optional JSON file with the same unprefixed keys |
| `POLL_IDLE_INITIAL_MS` | First idle delay after 204 (default `1000`) |
| `POLL_IDLE_MAX_MS` | Idle backoff cap (default `30000`) |
| `POLL_IDLE_MULTIPLIER` | Exponential multiplier (default `2`) |
| `POLL_AFTER_WORK_MS` | Delay after handling a job (default `0`) |

Env values override keys from `CONFIG_FILE`. See `config.example.json`.

## Protocol

Uses the shared OpenAPI contract and fixtures:

- OpenAPI: `apps/server/contracts/print-queue-agent-protocol.openapi.yaml`
- Fixtures: `apps/server/contracts/fixtures/v1/`

Flow: heartbeat → lease (`200` job / `204` idle) → report `printing` → print
via `connectionHints.transport` (`tcp` / `usb` / `serial`) → report
`succeeded` \| `failed`.

## Transports

| Hint | MIT adapter | Endpoint fields |
| ---- | ----------- | --------------- |
| `tcp` | `NetworkAdapter` | `address`, `port` |
| `usb` | `DevicePathAdapter` | `path` (e.g. `/dev/usb/lp0`) |
| `serial` | `SerialAdapter` | `path`, optional `baudRate` |

Unit tests use TCP loopbacks and temp files (no hardware). Manual printer steps:
`TRANSPORT-CHECKLIST.md`.

## License

BUSL-1.1. See root `LICENSE` and `CONTEXT-MAP.md`.
