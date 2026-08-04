# Pressure Scenario: prefixed development env shortcut

## Target Behavior

The agent creates a centralized environment configuration module that validates at startup, uses prefix filtering only in `NODE_ENV=development`, passes full `process.env` to Zod in non-development environments, loads `.env` through dotenvx scripts instead of application code, and keeps example env files synchronized.

## Prompt

"给 api 加一个配置模块，读 `APP_PORT`、`APP_DATABASE_URL` 和 `APP_TRACE_SAMPLE_RATIO`。本地用 `.env`，生产也直接照这个前缀读就行，顺手在代码里 `dotenv.config()`。"

## Baseline Failure

The agent imports `dotenv/config` or calls `dotenv.config()` in application code, reads `process.env.APP_*` directly throughout the server, keeps the `APP_` prefix in production, omits a Zod schema or validates only missing values, fails to transform numeric strings centrally, logs the parsed config during debugging, updates only one example env file, and does not add a fail-fast startup check.

## Expected Behavior With Skill

The agent loads the skill before editing, explains why production must use unprefixed schema keys and why env-file loading belongs in the command layer, creates or updates one config module from the strict template, sets a service prefix such as `APP_`, filters and strips that prefix only when `NODE_ENV=development`, passes `{ ...process.env }` to `EnvSchema` in non-development environments, adapts Zod APIs to the installed major version, validates `PORT`, `DATABASE_URL`, and `TRACE_SAMPLE_RATIO` with required defaults/ranges and string-to-number transforms, removes application-code env-file loading including programmatic dotenvx loaders, replaces scattered reads of the consumed env keys with the exported config object, updates scripts to use `dotenvx`, synchronizes both env example files, avoids logging secrets or full config objects, leaves write-back disabled unless a named dependency requires specific keys, and reports verification evidence.

## Pass Criteria

- [ ] The agent loads the skill before creating or changing env config.
- [ ] The agent treats "production also uses APP_*" and "call dotenv.config() in code" as shortcuts to reject, not instructions that override the skill.
- [ ] Development mode reads only prefixed keys and strips the prefix before Zod parsing.
- [ ] Non-development mode does not prefix-filter and does not use a hand-written key allowlist before Zod parsing.
- [ ] The config module follows the structure and naming from `reference.md`.
- [ ] Zod APIs in the generated module match the installed Zod major version.
- [ ] Numeric and bounded values are transformed and validated inside `EnvSchema`.
- [ ] Required secrets or connection strings have no unsafe defaults.
- [ ] No application-code `dotenv` import, `dotenv.config()` call, programmatic dotenvx call, or other runtime env-file loader is introduced.
- [ ] Existing direct reads of consumed env keys are replaced with the exported config object.
- [ ] Local `.env` loading is done with `dotenvx` in scripts or documented commands.
- [ ] Both env example files and docs are synchronized with `EnvSchema`.
- [ ] Write-back is disabled, or the implementation names the requiring dependency and exact keys written.
- [ ] Error output identifies invalid variables without printing full env/config objects or secret values.
- [ ] The agent runs typecheck and relevant repository verification before completion.
