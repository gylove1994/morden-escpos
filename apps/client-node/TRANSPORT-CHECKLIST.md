# Manual transport checklist (Node Printer Agent)

Vitest adapter tests write to temp files / TCP loopbacks and MUST NOT open real
hardware. Use this checklist for a physical printer. None of these steps gate CI.

## Prerequisites

- `pnpm --filter morden-node-escpos build`
- `pnpm --filter @workspace/client-node start` (or `dev`) with `SERVER_URL` +
  `DEVICE_TOKEN`
- A Printer in the console whose `connectionHints` match the transport under test

## TCP

1. Printer reachable on LAN (often port `9100`).
2. Console hints: `{ "transport": "tcp", "address": "<ip>", "port": 9100 }`.
3. Enqueue a raw job; confirm paper output and job `succeeded`.

## USB

1. Device node present (Linux example: `/dev/usb/lp0`). Confirm the Node process
   can write to that path.
2. Console hints: `{ "transport": "usb", "path": "/dev/usb/lp0" }`.
3. Enqueue a raw job; confirm output and `succeeded`.

## Serial

1. Port present (examples: `/dev/ttyUSB0`, `COM3`). Match baud rate to the
   printer (OS + `connectionHints.baudRate`).
2. Console hints:
   `{ "transport": "serial", "path": "/dev/ttyUSB0", "baudRate": 9600 }`.
3. Enqueue a raw job; confirm output and `succeeded`.

## Failure signals

- Job `failed` with an open/write error → path, permissions, or cable.
- Job stays `leased` / returns to `queued` → Printer Agent offline or crash.
