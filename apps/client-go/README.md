# Go Printer Agent (`@workspace/client-go`)

BSL on-site **Printer Agent** that polls the Print Queue Agent Protocol and
prints leased raw ESC/POS bytes over **TCP**.

## Requirements

- Go 1.22+
- A registered Printer Agent device token from the SaaS console
- Reachable control plane (`SERVER_URL`) and TCP printers

## Configuration

Centralized startup validation. Development uses the `APP_` prefix; deployment
uses unprefixed keys. Optional JSON config file via `CONFIG_PATH` / `-config`.

| Key | Description |
| --- | ----------- |
| `SERVER_URL` | Control plane base URL (e.g. `http://127.0.0.1:43128`) |
| `DEVICE_TOKEN` | Printer Agent device token (Bearer) |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` (default `info`) |
| `POLL_INTERVAL_MS` | Delay after a successful job (default `1000`) |
| `IDLE_BACKOFF_MS` | Initial idle backoff when lease returns 204 (default `1000`) |
| `IDLE_BACKOFF_MAX_MS` | Cap for idle backoff (default `30000`) |
| `CONFIG_PATH` | Optional JSON file with `serverUrl` and `deviceToken` |

See `env.example.dev` and `env.example.server`.

Example JSON config:

```json
{
  "serverUrl": "http://127.0.0.1:43128",
  "deviceToken": "pat_…"
}
```

## Run

```bash
# from apps/client-go
export SERVER_URL=http://127.0.0.1:43128
export DEVICE_TOKEN=pat_…
go run ./cmd/printer-agent
```

Or with a config file:

```bash
go run ./cmd/printer-agent -config ./printer-agent.config.json
```

## Test

```bash
go test ./...
```

Contract tests load shared fixtures from
`apps/server/contracts/fixtures/v1/` (see that directory’s README).

## Driver boundary

`driver/` sends raw bytes over TCP and MUST NOT import protocol/agent packages.
It is shaped for a future MIT extract into a standalone Go driver library; while
it lives under `apps/client-go` it remains BSL.

## License

BUSL-1.1 — see `LICENSE` and the repository root `LICENSE`.
