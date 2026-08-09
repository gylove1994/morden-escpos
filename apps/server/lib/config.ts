/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
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
    .default('43128')
    .transform(Number)
    .refine(v => v > 0 && v <= 65535, { message: 'PORT must be between 1 and 65535' }),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().min(1),
  BASE_URL: z.url().default('http://127.0.0.1:43128'),
  EDITION: z.enum(['cloud', 'self-hosted']).default('cloud'),
  // Better Auth human-session signing secret (NOT Printer Agent device tokens).
  AUTH_SECRET: z.string().min(32, { message: 'AUTH_SECRET must be at least 32 characters' }),

  // Stripe (cloud billing). Required when EDITION=cloud; unused on self-hosted.
  // Use Stripe test-mode keys (`sk_test_…`, `whsec_…`, `price_…`) locally.
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_PERSONAL: z.string().min(1).optional(),
  STRIPE_PRICE_BUSINESS: z.string().min(1).optional(),
  BILLING_RESELLER_CONTACT_URL: z
    .string()
    .min(1)
    .default('mailto:gylove1994@acgsteps.com?subject=morden-escpos%20reseller%20inquiry'),
  /**
   * Exclusive job lease duration in milliseconds.
   * Expired leases return to queued so another poll can pick them up.
   */
  JOB_LEASE_MS: z.string()
    .regex(/^\d+$/)
    .default('30000')
    .transform(Number)
    .refine(v => v >= 1_000 && v <= 600_000, {
      message: 'JOB_LEASE_MS must be between 1000 and 600000',
    }),
}).superRefine((data, ctx) => {
  if (data.EDITION !== 'cloud') {
    return;
  }
  for (const key of [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_PERSONAL',
    'STRIPE_PRICE_BUSINESS',
  ] as const) {
    if (!data[key]) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: `${key} is required when EDITION=cloud`,
      });
    }
  }
});

const parsed = EnvSchema.safeParse(envForParse);

if (!parsed.success) {
  console.error('Startup check failed, invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const SERVER_CONFIG = parsed.data;

export { SERVER_CONFIG };
