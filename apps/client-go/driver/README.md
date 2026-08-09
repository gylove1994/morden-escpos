# Driver-shaped TCP transport

This directory sends raw ESC/POS bytes to a network printer over TCP (typically
port 9100). It is intentionally free of Print Queue Agent Protocol and Printer
Agent orchestration imports so it can be extracted later into an MIT Go driver
library (see user story 57 / ticket #12).

While this code lives under `apps/client-go` it remains **BUSL-1.1**. On extract,
headers and package path would move to the mit-drivers context.

USB and Serial transports are out of scope for this slice (#13).
