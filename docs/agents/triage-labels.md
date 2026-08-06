# Triage Labels

The skills speak in terms of five canonical triage **state** roles. This file maps those roles to the actual label strings used in this repo's issue tracker, and documents the orthogonal **area** labels used to route work in the monorepo.

## State roles

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Every triaged issue *SHOULD* carry exactly one state role (and, per `/triage`, one category role such as `bug` or `enhancement`).

## Main-flow labels

These labels are **orthogonal** to triage state roles. They mark stages on the idea → ship path (spec → tickets → implement), not incoming triage.

| Label in our tracker | Meaning                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `ready-for-split`    | Spec/PRD is finalized; ready for `/to-tickets` (split into tracer-bullet tickets with blocking edges) |
| `ready-for-agent`    | Also used here for a single ticket that is unblocked and ready to `/implement` (same string as the triage state role) |

Apply `ready-for-split` on the **spec/PRD issue** (or the issue that carries the finalized spec). After split, remove or replace it; frontier tickets then receive `ready-for-agent` when they have no open blockers.

## Area labels

Area labels are **orthogonal** to state and category. They mark which package or app the issue primarily touches so agents and humans can filter work. Apply **zero or more** when the scope is clear; prefer the most specific area(s). Cross-cutting tooling or docs-only work may omit an area label.

| Label in our tracker           | Paths                                              | Notes                                      |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------ |
| `area:morden-node-escpos`      | `packages/morden-node-escpos`                      | Primary MIT ESC/POS driver library         |
| `area:jsonjoy-builder`         | `packages/jsonjoy-builder`                         | JSON schema / form builder (MIT upstream)  |
| `area:ui`                      | `packages/ui`                                      | Shared UI package                          |
| `area:template-editor`         | `apps/template-editor`                             | MIT template editor app                    |
| `area:server`                  | `apps/server`                                      | Planned BSL SaaS API / print-queue backend |
| `area:client-node`             | `apps/client-node`                                 | Planned BSL Node client                    |
| `area:client-go`               | `apps/client-go`                                   | Planned BSL Go client                      |
| `area:landing`                 | `apps/landing`                                     | Planned BSL landing site                   |

License context for these paths is in root `CONTEXT-MAP.md`. Area labels do **not** replace license context; they only route issues.

When `/triage` (or a maintainer) can tell which tree is in scope, *SHOULD* add the matching `area:*` label(s) alongside the state and category labels.
