# Context map

This monorepo is split by **license**, not by deployable alone. Read the context that matches the paths you are changing.

| Context | License | Paths | CONTEXT.md |
| ------- | ------- | ----- | ---------- |
| **mit-drivers** | MIT | `packages/morden-node-escpos`, `packages/jsonjoy-builder`, `packages/ui`, `apps/template-editor`, future Go driver libs | `packages/morden-node-escpos/CONTEXT.md` (primary MIT context; other MIT packages may add a short `CONTEXT.md` or point here) |
| **bsl-saas** | BSL 1.1 → AGPL-3.0-or-later after Change Date (four years from publication; see root `LICENSE`) | `apps/server`, `apps/client-node`, `apps/client-go`, `apps/landing`, SaaS-only packages | `apps/server/CONTEXT.md` (primary SaaS context); `apps/client-node/CONTEXT.md` |

Cross-cutting ADRs (license boundaries, monorepo layout, shared tooling): `docs/adr/`.
