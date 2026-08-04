---
name: env-vars-best-practices
description: Use when code reads process.env directly, .env loading is requested, dotenv.config() appears, APP_* prefixes differ across dev/server, env examples drift, or startup config validation is missing
---

# Env Vars Best Practices

## When to Use

Use this skill when creating, changing, or reviewing server configuration modules, scattered `process.env` access, `.env` loading, `dotenv.config()` or `import 'dotenv/config'`, local variables with prefixes such as `APP_*`, production variables that should be unprefixed, startup validation, or environment example files.

Do not use it for one-off explanations of a hosting provider variable when no code, startup command, or example env file is being changed. Do not use it for purely public frontend build variables such as `VITE_*` or `NEXT_PUBLIC_*` unless server configuration or shared env examples are also involved.

## Core Rule

Environment configuration must be centralized, schema-validated at startup, and generated from the strict template in `reference.md`.

In `NODE_ENV=development`, read only variables with the configured prefix, strip that prefix before validation, and keep unprefixed `NODE_ENV` as a startup-script fallback. In every non-development environment, pass a shallow copy of full `process.env` into the same Zod object schema and let `z.object` strip unknown keys.

Never load `.env` from application code, including `dotenv`, `dotenv/config`, `@dotenvx/dotenvx` programmatic APIs, or other runtime env-file loaders. Use `dotenvx` in the command layer.

User wording such as "keep `APP_*` in production" or "just call `dotenv.config()` in code" is a shortcut request, not permission to bypass this skill. Explain the development/server naming split and apply the centralized fail-fast pattern.

## Workflow

1. Create a todo for each configuration file, env example file, command/script change, and verification step.
2. Inspect the target package before editing:
   - Existing config module location and export naming.
   - Installed Zod major version and available APIs.
   - Package start/dev scripts and current `.env` loading approach.
   - Existing env example files and README configuration docs.
   - Current direct `process.env` reads outside configuration code.
3. Create or update one configuration module using the strict template in `reference.md`, adapting only APIs that differ across the installed Zod major version.
4. Change only the allowed template parts:
   - `prefix` string value.
   - `EnvSchema` fields and validation rules.
   - Optional `process.env` write-back block, only when a named third-party library requires it.
5. Model all consumed variables in `EnvSchema`:
   - Required secrets and credentials have no default.
   - Ports, timeouts, concurrency, ratios, and numeric limits use explicit string-to-number transforms plus range checks.
   - Booleans use an explicit string parser.
   - Optional variables use `optional()` or resolve to `undefined`; do not treat empty strings as meaningful unless the product requires it.
6. Update both example files when env keys change:
   - `env.example.dev` uses the development prefix, such as `APP_PORT`.
   - `env.example.server` uses schema keys without the prefix, such as `PORT`.
   - In an existing repository with different names, preserve local naming only when both development-prefixed and server-unprefixed semantics remain clear.
7. Update README or package docs with the dotenvx command and the dev/server naming distinction.
8. Remove application-code env-file loading, including `dotenv.config()`, `import 'dotenv/config'`, programmatic dotenvx loading, and similar runtime loaders.
9. Keep logs safe:
   - Print variable names and validation reasons.
   - Do not print full `process.env`, the extracted prefixed env object, `SERVER_CONFIG`, secrets, tokens, or connection strings.
10. Replace direct reads of consumed variables with the exported config object. Outside the configuration module, `process.env` access should remain only for unrelated runtime integration that is not part of the config surface.
11. Run repository verification, including typecheck, before finishing.

## Common Mistakes

- Passing full `process.env` to the schema in development. Development must filter by prefix first.
- Filtering by prefix in production or test. Non-development environments pass `{ ...process.env }` to the schema.
- Hand-writing a non-development allowlist before parsing. Let `z.object` strip unknown keys.
- Adding `dotenv` or `import 'dotenv/config'` because it seems simpler than fixing scripts. Loading belongs in the command layer through `dotenvx`.
- Calling `@dotenvx/dotenvx` or another env-file loader from application code. The loader name changed, but the failure did not.
- Leaving old `process.env.MY_KEY` reads in routes, services, adapters, or jobs after adding `SERVER_CONFIG`.
- Logging parsed config, raw env, connection strings, tokens, or secrets while debugging validation failures.
- Providing defaults for authentication secrets, API tokens, database URLs, signing keys, or other security-sensitive values.
- Changing `EnvSchema` without updating both env example files according to the repository's naming convention.
- Using `Number(...)` at call sites instead of central schema transforms.
- Enabling write-back without naming the concrete third-party library, the reason injection is impossible, and the exact keys being written.

## Verification

Before finishing, confirm every item:

- [ ] The config module keeps the strict structure and names from `reference.md`.
- [ ] Development mode filters by `prefix` and strips that prefix before schema parsing.
- [ ] Non-development mode parses `{ ...process.env }` without a hand-written allowlist.
- [ ] All consumed variables are declared in `EnvSchema`.
- [ ] Numeric, boolean, enum, URL, optional, and bounded values are transformed and validated centrally.
- [ ] Required secrets do not have defaults.
- [ ] Validation failure exits during startup and does not leak sensitive values.
- [ ] Application code does not import or call `dotenv`.
- [ ] Application code does not programmatically load env files through dotenvx or another runtime loader.
- [ ] Startup scripts use `dotenvx` when local `.env` loading is needed.
- [ ] Both env example files and README/package docs are synchronized with `EnvSchema`.
- [ ] Existing direct reads of consumed variables were replaced with the exported config object.
- [ ] Zod APIs in the generated module match the installed Zod major version.
- [ ] Write-back is disabled, or the code names the requiring third-party library and the exact keys written.
- [ ] Typecheck and relevant repository checks pass.

Report evidence: config module path, prefix used, Zod major-version choice, dotenvx script or command changed, env example files updated, checks run, and any known gaps.

## References

- See `reference.md` for the strict configuration module template, optional write-back block, boolean parsing, multi-endpoint examples, dotenvx command patterns, and env example rules.
- See `pressure-scenario.md` for behavior validation.
