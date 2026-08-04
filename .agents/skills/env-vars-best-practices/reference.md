# Env Vars Reference

## Strict Configuration Module Template

Use this template when generating a server configuration module. Keep the structure and variable names intact. Only change:

- The `prefix` value.
- Fields and validation rules inside `EnvSchema`.
- The optional `process.env` write-back block.

This template does not load `.env` files. Use `dotenvx` in package scripts or command wrappers instead of importing `dotenv`, calling dotenvx programmatic APIs, or using any other env-file loader from application code.

```ts
import process from 'node:process';
import { z } from 'zod';

// Prefix applies only when NODE_ENV=development: local APP_* values stay isolated; production/test use unprefixed deployment variables.
const isDev = process.env.NODE_ENV === 'development';
const prefix = 'APP_';

type RawEnvKey = `${typeof prefix}${string}`;

const envWithPrefix = Object.keys(process.env)
  .filter((key): key is RawEnvKey => key.startsWith(prefix))
  .reduce((acc, key) => {
    const keyWithoutPrefix = key.slice(prefix.length);
    acc[keyWithoutPrefix] = process.env[key];
    return acc;
  }, {} as Record<string, string | undefined>);

// Development NODE_ENV is often injected directly by the startup script; APP_NODE_ENV wins when present.
// Non-development: do not filter keys. Pass full process.env to EnvSchema and let z.object strip unknown keys.
const envForParse = isDev
  ? { ...envWithPrefix, NODE_ENV: envWithPrefix.NODE_ENV ?? process.env.NODE_ENV }
  : { ...process.env };

const EnvSchema = z.object({
  PORT: z.string()
    .regex(/^\d+$/)
    .default('3000')
    .transform(Number)
    .refine(v => v > 0 && v <= 65535, { message: 'PORT must be between 1 and 65535' }),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().min(1),

  // Zod 4: z.url(). Zod 3: use z.string().url().
  BASE_URL: z.url().default('http://localhost:3000'),

  TRACE_SAMPLE_RATIO: z.string()
    .default('1')
    .transform(Number)
    .refine(v => v >= 0 && v <= 1, { message: 'TRACE_SAMPLE_RATIO must be between 0 and 1' }),

  CONCURRENCY: z.string()
    .regex(/^\d+$/)
    .optional()
    .default('10')
    .transform(Number)
    .refine(v => v >= 1 && v <= 100, { message: 'CONCURRENCY must be between 1 and 100' }),
});

// Validate the stripped development object or the full non-development process.env copy.
const parsed = EnvSchema.safeParse(envForParse);

if (!parsed.success) {
  console.error('Startup check failed, invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const SERVER_CONFIG = parsed.data;

// Optional write-back to process.env. Enable only when a named dependency cannot accept injected config.
// Document the dependency name, reason, and exact keys near the enabled block.
// - Values must be strings.
// - Values must overwrite original process.env entries.
// - Keys must be the unprefixed EnvSchema field names.
// for (const [key, value] of Object.entries(SERVER_CONFIG)) {
//   process.env[key] = String(value);
// }

export { SERVER_CONFIG };
```

### Zod Version Notes

- Zod 4 supports `z.url()` and `z.treeifyError(...)`.
- Zod 3 uses `z.string().url()` and `parsed.error.format()` or `parsed.error.flatten()`.
- Match the installed project version; do not upgrade Zod just to use this template unless the task explicitly includes dependency changes.
- After copying the template, replace any incompatible Zod API before running typecheck.

## Optional Boolean Parser

```ts
const boolFromString = z
  .string()
  .transform(v => v.toLowerCase())
  .refine(v => ['true', 'false', '1', '0'].includes(v), { message: 'must be boolean-like' })
  .transform(v => v === 'true' || v === '1');

const EnvSchema = z.object({
  ENABLE_FEATURE_X: boolFromString.default('false'),
});
```

## Multiple Endpoint Overrides

Use explicit optional endpoint overrides when a service has one default endpoint plus specialized trace, metric, or log endpoints.

```ts
const EnvSchema = z.object({
  OTLP_ENDPOINT: z.url().default('http://localhost:4318'),
  OTLP_TRACES_ENDPOINT: z.url().optional(),
  OTLP_METRICS_ENDPOINT: z.url().optional(),
  OTLP_LOGS_ENDPOINT: z.url().optional(),
});
```

For Zod 3, replace `z.url()` with `z.string().url()`.

## Dotenvx in Monorepos

Load `.env` from the command layer. Do not call `dotenv.config()`, import `dotenv/config`, call `@dotenvx/dotenvx` programmatically, or use another env-file loader in application code.

```bash
# Start from a subpackage while loading the repository-root .env file.
dotenvx run -f ../../.env -- node ./src/index.js

# Combine files. Earlier files win by default.
dotenvx run -f ../../.env.local -f ../../.env -- node ./src/index.js

# Let later files override earlier files.
dotenvx run -f ../../.env -f ../../.env.local --overload -- node ./src/index.js

# Debug which files load. Avoid verbose output in CI or shared logs.
dotenvx run -f ../../.env --verbose -- node ./src/index.js
```

Prefer package scripts that work from the package directory and load env files from a predictable repository-root path.

## Env Example Files

Maintain both development-prefixed and server-unprefixed examples whenever `EnvSchema` changes:

- `env.example.dev`: development values with the configured prefix, for example `APP_PORT=3000`.
- `env.example.server`: deployment and non-development values without the prefix, for example `PORT=3000`.

For new services, prefer the exact names above. For existing repositories with a different convention, preserve the local file names only when there are still two clearly separated semantics: one development-prefixed example and one server-unprefixed example.

Both examples describe the same configuration semantics. If a variable is added, renamed, deleted, made optional, given a default, or given a new range, update `EnvSchema`, both env example files, and README/package docs in the same change.

Use fake but structurally valid placeholders for examples, such as `postgres://user:pass@localhost:5432/app` or `REPLACE_ME`. Never commit real secrets, tokens, passwords, or production connection strings.

Frontend framework prefixes such as `VITE_` may appear in their own section when the target app needs build-time public variables. Do not expose server secrets through frontend-prefixed variables.

## Safe Error Output

Print:

- Missing or invalid variable names.
- Validation reasons, such as enum mismatch, invalid URL, non-numeric value, or out-of-range value.

Do not print:

- Full `process.env`.
- The prefixed raw env object.
- Full `SERVER_CONFIG`.
- Secret, token, key, password, or connection-string values.

If value visibility is unavoidable for diagnosis, mask it first, such as preserving only the first and last two characters.
