## Agent skills

### Contributor docs

Human-facing contribution docs (English): [`CONTRIBUTING.md`](./CONTRIBUTING.md), [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md), [`SECURITY.md`](./SECURITY.md). GitHub templates live under `.github/`.

### Issue tracker

Issues live in this repo's GitHub Issues (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Five state roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) plus orthogonal `area:*` labels for monorepo packages/apps. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context by license: MIT drivers vs BSL SaaS. See `docs/agents/domain.md` and root `CONTEXT-MAP.md`.

### Docs Language

Every document/skill *MUST* be written in English.

### Vocabulary

Use RFC 2119 keywords: *MUST*, *MUST NOT*, *REQUIRED*, *SHALL*, *SHALL NOT*, *SHOULD*, *SHOULD NOT*, *RECOMMENDED*, *MAY*, and *OPTIONAL*.

### File Headers

Every source file *MUST* start with a license header that matches its context in `CONTEXT-MAP.md`. Pick the license from the path; do **not** invent a third license or mix MIT and BSL in one file.

| Context | SPDX | Paths (see `CONTEXT-MAP.md`) |
| ------- | ---- | ---------------------------- |
| **mit-drivers** | `MIT` | `packages/morden-node-escpos`, `packages/jsonjoy-builder`, `packages/ui`, `apps/template-editor`, future Go driver libs |
| **bsl-saas** | `BUSL-1.1` | `apps/server`, `apps/client-node`, `apps/client-go`, `apps/landing`, SaaS-only packages |

#### Required fields

1. **`SPDX-License-Identifier`** — `MIT` or `BUSL-1.1` (required).
2. **`Copyright`** — year and holder (required):
   - **mit-drivers** (first-party) — `morden-escpos-contributors`.
   - **bsl-saas** — `GYlove1994 <gylove1994@acgsteps.com>`.
   - **Modified upstream** — keep the upstream copyright line(s), then add ours (see below).

#### Applies to

- *MUST* on new or substantially edited source: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.go`.
- *SHOULD* on other authored source (e.g. `.css`, `.scss`) when adding a non-trivial file.
- *MUST NOT* on generated output, lockfiles, or unmodified third-party vendored trees that already carry their own license.

Place the header at the top of the file. A shebang (`#!/usr/bin/env …`), if present, *MUST* come first; the license block follows immediately.

#### Templates

**TypeScript / JavaScript (MIT, first-party):**

```ts
/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
```

**TypeScript / JavaScript (MIT, modified upstream):**

```ts
/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
```

(Keep every upstream copyright year/name as in the original; append our line for local changes. Example holder is `jsonjoy-builder` — use the real upstream notice from that package’s `LICENSE` / file header.)

**TypeScript / JavaScript (BSL):**

```ts
/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
```

**Go (MIT):**

```go
// Copyright (c) 2026 morden-escpos-contributors
// SPDX-License-Identifier: MIT
```

**Go (BSL):**

```go
// Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
// SPDX-License-Identifier: BUSL-1.1
```

#### Modified upstream MIT packages

MIT does **not** transfer ownership when you fork or edit. For a tree derived from upstream MIT code (e.g. `packages/jsonjoy-builder`):

1. **License stays `MIT`** — do not relicense upstream code as BSL or anything else.
2. **Retain upstream copyright** — keep the original `Copyright` line(s) in `LICENSE` and in file headers you touch.
3. **Add our copyright** — append `Copyright (c) YEAR morden-escpos-contributors` for our modifications.
4. **New files we author inside that package** — first-party MIT header only (`morden-escpos-contributors`).
5. **Unchanged upstream files** — leave their headers alone until you edit them; when you edit, apply the stacked copyright form above.
6. **Record provenance** — keep `UPSTREAM.md` (or equivalent) with upstream URL, version/commit, and license.

Package `LICENSE` for a modified upstream tree *SHOULD* list both notices, upstream first:

```text
Copyright (c) 2025 Ophir LOJKINE
Copyright (c) 2026 morden-escpos-contributors
```

#### Rules

- When creating a file, choose the SPDX id from the path’s context in `CONTEXT-MAP.md`.
- When moving a file across the MIT / BSL boundary, update the header to match the destination context. *MUST NOT* move upstream-derived MIT code into **bsl-saas** without a deliberate relicensing review (usually: keep it MIT in a shared package and depend on it).
- Do not paste the full license text into every file; the SPDX line points at the package or repo `LICENSE`.
- Keep the year current for new files; for edits, bump the year only if you are already touching the header.
