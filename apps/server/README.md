# @workspace/server

BSL SaaS print-queue control plane. See [`CONTEXT.md`](./CONTEXT.md).

## Requirements

- Node.js 22+
- pnpm 10.x
- PostgreSQL 16+ (local URL defaults are in `env.example.dev`)

## Scripts

| Command | Purpose |
| ------- | ------- |
| `pnpm --filter @workspace/server dev` | Next.js dev server (port 43128) via dotenvx + `env.example.dev` |
| `pnpm --filter @workspace/server build` | Production build |
| `pnpm --filter @workspace/server db:generate` | Generate Drizzle migrations from `lib/db/schema.ts` |
| `pnpm --filter @workspace/server db:migrate` | Apply migrations |
| `pnpm --filter @workspace/server test` | Vitest (health, OpenAPI, human-session auth) |
| `pnpm --filter @workspace/server typecheck` | `tsc --noEmit` |

## Configuration

Development uses `APP_*` keys in `env.example.dev`. Non-development uses
unprefixed keys in `env.example.server`. Required auth secret:

- Dev: `APP_AUTH_SECRET` (min 32 chars)
- Server: `AUTH_SECRET` (min 32 chars)

`AUTH_SECRET` signs **human session** cookies (Better Auth). It is not a
Printer Agent device token.

## Human session auth + Organization RBAC

- Signup / login: `/signup`, `/login` → Better Auth at `/api/auth/*`
- Create Organization (creator becomes **owner**): `/console/create-organization`
- Signed-in Organization shell: `/console`
- Roles: `owner` | `admin` | `member`
- Protected example: `PATCH /api/console/org-settings` requires owner/admin
- Session probe: `GET /api/console/session` (401 without a session cookie)

## Edition stub

Set `EDITION=cloud` (default) or `EDITION=self-hosted` for the compile/build stub.
`next.config.ts` inlines the value; `lib/edition.ts` exposes helpers. Route
trimming is deferred.

## Print Queue Agent Protocol

OpenAPI skeleton: `contracts/print-queue-agent-protocol.openapi.yaml`.

The server references and serves it at `GET /api/protocol/openapi`.

## Health

`GET /api/health` returns `{ status: "ok", edition, database: "up" }` when
Postgres is reachable.
