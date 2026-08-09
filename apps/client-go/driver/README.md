# Driver-shaped transports (TCP / USB / Serial)

This directory sends raw ESC/POS bytes to local printers. It is intentionally
free of Print Queue Agent Protocol and Printer Agent orchestration imports so
it can be extracted later into an MIT Go driver library.

| File | Transport | Endpoint |
| ---- | --------- | -------- |
| `tcp.go` | TCP | `address` + `port` (typically 9100) |
| `usb.go` | USB | filesystem `path` (e.g. `/dev/usb/lp0`) |
| `serial.go` | Serial | filesystem `path` + optional `baudRate` |

While this code lives under `apps/client-go` it remains **BUSL-1.1**. On extract,
headers and package path would move to the mit-drivers context.

Adapter tests write to temp files and MUST NOT require real hardware. See
`TRANSPORT-CHECKLIST.md` for manual printer verification.
