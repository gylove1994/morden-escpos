# Manual transport checklist (Go Printer Agent)

Protocol seam / unit tests use temp files and TCP loopbacks. Use this checklist
when verifying a real shop printer. None of these steps gate CI.

## Prerequisites

- Built binary: `cd apps/client-go && go build -o dist/printer-agent ./cmd/printer-agent`
- Valid `SERVER_URL` + `DEVICE_TOKEN`
- A Printer in the console whose `connectionHints` match the transport under test

## TCP

1. Printer reachable on LAN (often port `9100`).
2. Console hints: `{ "transport": "tcp", "address": "<ip>", "port": 9100 }`.
3. Enqueue a raw job; confirm paper output and job `succeeded`.

## USB

1. Device node present (Linux example: `/dev/usb/lp0`). Confirm write permission
   for the Printer Agent user (udev rules / group membership as needed).
2. Console hints: `{ "transport": "usb", "path": "/dev/usb/lp0" }`.
3. Enqueue a raw job; confirm output and `succeeded`.

## Serial

1. Port present (examples: `/dev/ttyUSB0`, `COM3`). Set OS baud if required
   (`stty` / Device Manager) to match the printer.
2. Console hints:
   `{ "transport": "serial", "path": "/dev/ttyUSB0", "baudRate": 9600 }`.
3. Enqueue a raw job; confirm output and `succeeded`.

## Failure signals

- Job `failed` with an open/write error → path, permissions, or cable.
- Job stays `leased` / returns to `queued` → Printer Agent offline or crash.
