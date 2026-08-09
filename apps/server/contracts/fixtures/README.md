# Print Queue Agent Protocol fixtures

Language-agnostic JSON fixtures for Printer Agent contract tests (Node and Go).

| File | Purpose |
| ---- | ------- |
| `lease-response.example.json` | Successful `POST /jobs/lease` body |
| `report-printing.request.json` | `printing` report body |
| `report-succeeded.request.json` | `succeeded` report body |
| `report-failed.request.json` | `failed` report body (includes `errorMessage`) |
| `heartbeat-response.example.json` | Successful heartbeat body |
| `job-state-transitions.json` | Allowed / illegal job status transitions |

Clients MUST encode requests and decode responses to match these shapes, and
MUST enforce the transition table before reporting outcomes.
