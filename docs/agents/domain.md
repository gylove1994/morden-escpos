# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root — points at one `CONTEXT.md` per license context. Read each one relevant to the topic.
- **`docs/adr/`** — system-wide / cross-license decisions.
- Context-scoped ADRs under the paths listed in `CONTEXT-MAP.md` (e.g. `packages/morden-node-escpos/docs/adr/`, `apps/server/docs/adr/`).

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Multi-context by **license** (MIT drivers vs BSL SaaS):

```
/
├── CONTEXT-MAP.md
├── docs/adr/                              ← cross-cutting decisions
├── packages/
│   ├── morden-node-escpos/                ← mit-drivers (primary)
│   │   ├── CONTEXT.md
│   │   └── docs/adr/
│   ├── jsonjoy-builder/                   ← MIT
│   └── ui/                                ← MIT
├── apps/
│   ├── template-editor/                   ← MIT
│   ├── server/                            ← bsl-saas (primary, planned)
│   │   ├── CONTEXT.md
│   │   └── docs/adr/
│   ├── client-node/                       ← BSL (Node Printer Agent)
│   ├── client-go/                         ← BSL (planned)
│   └── landing/                           ← BSL (marketing landing)
└── …                                      ← SaaS-only packages: CONTEXT.md + docs/adr/
```

License rules of thumb:

- **mit-drivers** — ESC/POS drivers, editor, shared MIT libs; keep MIT; do not pull BSL-only SaaS logic into these paths.
- **bsl-saas** — print-queue platform apps; BSL 1.1 (root `LICENSE`) with Change Date four years from publication → AGPL-3.0-or-later; may depend on MIT packages, not the reverse for proprietary platform code.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
