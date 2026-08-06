# Contributing

Thanks for helping improve this project. This monorepo hosts **MIT** ESC/POS drivers and tooling alongside **BSL** SaaS apps. Please read this guide before opening an issue or pull request.

## Code of conduct

Participation is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Contributions are welcome everywhere

Contributions to **any** part of this repository are welcome — MIT drivers, shared tooling, docs, and BSL SaaS paths alike.

Path → license mapping lives in [`CONTEXT-MAP.md`](./CONTEXT-MAP.md):

| Area | License |
| ---- | ------- |
| `packages/morden-node-escpos`, `packages/ui`, `apps/template-editor`, and other **mit-drivers** paths | MIT |
| `packages/jsonjoy-builder` (modified upstream) | MIT (keep upstream copyright; see [File headers](#file-headers--licenses)) |
| `apps/server`, `apps/client-*`, `apps/landing`, and other **bsl-saas** paths | BSL 1.1 (see root [`LICENSE`](./LICENSE)) |

### Contribution terms (read before you submit)

By opening a pull request, you agree to the following for the code (and related material) you submit:

1. **MIT paths (`mit-drivers`)** — You license your contribution under the **MIT License**. It may be attributed to `morden-escpos-contributors` and redistributed with the rest of that MIT code.
2. **BSL paths (`bsl-saas`)** — You **relinquish your rights** in that contribution to the BSL copyright holder, **GYlove1994 \<gylove1994@acgsteps.com\>**. In practice this means:
   - you assign / waive any copyright and related claims in the contributed material to that holder;
   - the contribution is treated as owned under the BSL copyright notice (`Copyright (c) YEAR GYlove1994 <gylove1994@acgsteps.com>`);
   - you do **not** retain a separate copyright interest in that BSL contribution, and you do not expect dual ownership or an MIT-style grant back for that code.
3. **Mixed PRs** — If a single PR touches both contexts, the MIT terms apply to the MIT-path files and the BSL relinquishment applies to the BSL-path files.
4. **If you cannot agree** — Do not contribute to BSL paths. You may still contribute to MIT paths under term (1), or open an issue to discuss alternatives.

Submitting a PR that changes files under a **bsl-saas** path is an explicit acceptance of term (2) for those changes.

## Getting started

Requirements:

- Node.js 22+ (or the version expected by the workspace tooling)
- [pnpm](https://pnpm.io/) 10.x (see `packageManager` in root `package.json`)

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

Useful commands:

| Command | Purpose |
| ------- | ------- |
| `pnpm dev` | Run the template editor app |
| `pnpm lint:fix` | Auto-fix ESLint issues where possible |
| `pnpm test` | Run the Turborepo test pipeline |

Git hooks (via Lefthook) run `pnpm lint` on pre-commit and Commitlint on `commit-msg`.

## Issues

- Search [existing issues](https://github.com/gylove1994/morden-escpos/issues) before opening a new one.
- Use the issue templates when they fit (bug / feature).
- Maintainers triage with state labels such as `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`, plus `area:*` labels for the affected package or app (see `docs/agents/triage-labels.md`).

Security vulnerabilities: **do not** file a public issue. See [SECURITY.md](./SECURITY.md).

## Pull requests

1. Fork the repo (or use a branch if you have write access).
2. Create a focused branch (`fix/…`, `feat/…`, `docs/…`).
3. Make a small, reviewable change. Prefer one concern per PR.
4. Add or update tests when behavior changes.
5. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass locally.
6. Open a PR against `main` using the PR template.

### Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(printer): support QR code size option
fix(webusb): handle disconnect during write
docs: clarify MIT file header for upstream forks
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`.

### What reviewers look for

- Change stays inside the correct license context (`CONTEXT-MAP.md`).
- New source files include the required [file header](#file-headers--licenses).
- Public API changes are documented in the relevant package README.
- No secrets, credentials, or machine-specific paths.

## File headers & licenses

New or substantially edited source files *MUST* include a short SPDX header. Full rules and templates are in [`AGENTS.md`](./AGENTS.md#file-headers).

Summary:

- **First-party MIT** — `Copyright (c) YEAR morden-escpos-contributors` + `SPDX-License-Identifier: MIT`
- **Modified upstream MIT** — keep upstream copyright line(s), then add `morden-escpos-contributors`
- **BSL SaaS** — `Copyright (c) YEAR GYlove1994 <gylove1994@acgsteps.com>` + `SPDX-License-Identifier: BUSL-1.1`

Licensing of your contribution is governed by [Contribution terms](#contribution-terms-read-before-you-submit) above.

Do **not** move MIT (including upstream-derived) code into BSL paths without an explicit maintainer decision — that would reclassify the code under BSL terms and the BSL relinquishment rule.

## Modified upstream packages

Packages such as `packages/jsonjoy-builder` are derived from upstream MIT projects. When editing them:

1. Keep the license as MIT.
2. Retain upstream copyright notices.
3. Append our copyright for local changes.
4. Update `UPSTREAM.md` if the pinned upstream version/commit changes.

## Documentation language

Project docs intended for contributors and agents *MUST* be written in **English** (see `AGENTS.md`).

## Getting help

- Questions about usage or design: open a GitHub Discussion or issue.
- Security: [SECURITY.md](./SECURITY.md).
- Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
