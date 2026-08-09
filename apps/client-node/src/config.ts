/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { z } from 'zod';

const prefix = 'APP_';

type RawEnvKey = `${typeof prefix}${string}`;

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SERVER_URL: z.url(),
  DEVICE_TOKEN: z.string().min(1, { message: 'DEVICE_TOKEN is required' }),
  /** Initial idle delay (ms) after a 204 / no-work poll. */
  POLL_IDLE_INITIAL_MS: z.string()
    .regex(/^\d+$/)
    .default('1000')
    .transform(Number)
    .refine(v => v >= 50 && v <= 600_000, {
      message: 'POLL_IDLE_INITIAL_MS must be between 50 and 600000',
    }),
  /** Cap for exponential idle backoff (ms). */
  POLL_IDLE_MAX_MS: z.string()
    .regex(/^\d+$/)
    .default('30000')
    .transform(Number)
    .refine(v => v >= 50 && v <= 600_000, {
      message: 'POLL_IDLE_MAX_MS must be between 50 and 600000',
    }),
  /** Multiplier applied to idle delay after consecutive empty polls. */
  POLL_IDLE_MULTIPLIER: z.string()
    .regex(/^\d+(\.\d+)?$/)
    .default('2')
    .transform(Number)
    .refine(v => v >= 1 && v <= 10, { message: 'POLL_IDLE_MULTIPLIER must be between 1 and 10' }),
  /** Delay (ms) before the next poll after successfully handling work. */
  POLL_AFTER_WORK_MS: z.string()
    .regex(/^\d+$/)
    .default('0')
    .transform(Number)
    .refine(v => v >= 0 && v <= 60_000, {
      message: 'POLL_AFTER_WORK_MS must be between 0 and 60000',
    }),
});

export type ClientConfig = z.infer<typeof EnvSchema>;

function stripDevPrefix(env: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return Object.keys(env)
    .filter((key): key is RawEnvKey => key.startsWith(prefix))
    .reduce((acc, key) => {
      const keyWithoutPrefix = key.slice(prefix.length);
      acc[keyWithoutPrefix] = env[key];
      return acc;
    }, {} as Record<string, string | undefined>);
}

/**
 * Optional JSON config file. Keys match EnvSchema field names (unprefixed).
 * Env values always win over file values when both are present.
 */
export function loadConfigFile(
  configPath: string | undefined,
): Record<string, string | undefined> {
  if (!configPath) {
    return {};
  }

  const raw: unknown = JSON.parse(readFileSync(configPath, 'utf8'));
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('CONFIG_FILE must be a JSON object');
  }

  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === undefined || value === null) {
      continue;
    }
    out[key] = typeof value === 'string' ? value : String(value);
  }
  return out;
}

export function parseClientConfig(env: NodeJS.ProcessEnv = process.env): ClientConfig {
  const isDev = env.NODE_ENV === 'development';
  const envWithPrefix = stripDevPrefix(env);
  const configPath = isDev
    ? (envWithPrefix.CONFIG_FILE ?? env.APP_CONFIG_FILE)
    : env.CONFIG_FILE;
  const fileConfig = loadConfigFile(configPath);

  const envForParse = isDev
    ? {
        ...fileConfig,
        ...envWithPrefix,
        NODE_ENV: envWithPrefix.NODE_ENV ?? env.NODE_ENV,
      }
    : {
        ...fileConfig,
        ...env,
      };

  const parsed = EnvSchema.safeParse(envForParse);
  if (!parsed.success) {
    throw new Error(
      `Invalid Printer Agent environment variables: ${JSON.stringify(parsed.error.format(), null, 2)}`,
    );
  }

  if (parsed.data.POLL_IDLE_INITIAL_MS > parsed.data.POLL_IDLE_MAX_MS) {
    throw new Error('POLL_IDLE_INITIAL_MS must be <= POLL_IDLE_MAX_MS');
  }

  return parsed.data;
}

function loadOrExit(): ClientConfig {
  try {
    return parseClientConfig(process.env);
  }
  catch (error) {
    console.error(
      'Startup check failed, invalid environment variables:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

const CLIENT_CONFIG = loadOrExit();

export { CLIENT_CONFIG };
