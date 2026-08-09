/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import process from 'node:process';

const databaseUrl = 'postgres://morden:morden@127.0.0.1:5432/morden_escpos_test';
const baseUrl = 'http://127.0.0.1:43128';
const authSecret = 'test-only-auth-secret-at-least-32-chars!!';

// Vitest/Vite sets BASE_URL to the Vite `base` path (often "/"), which is not a
// valid absolute URL for SERVER_CONFIG. Always overwrite scaffold test env.
const stripeSecret = 'sk_test_billing_harness_not_a_real_key';
const stripeWebhookSecret = 'whsec_billing_harness_not_a_real_secret';
const stripePricePersonal = 'price_test_personal';
const stripePriceBusiness = 'price_test_business';
const resellerContact
  = 'mailto:gylove1994@acgsteps.com?subject=morden-escpos%20reseller%20inquiry';
const platformAdminSecret = 'test-only-platform-admin-secret-32chars!!';

process.env.PORT = '43128';
process.env.BASE_URL = baseUrl;
process.env.LOG_LEVEL = 'info';
process.env.EDITION = 'cloud';
process.env.DATABASE_URL = databaseUrl;
process.env.AUTH_SECRET = authSecret;
process.env.STRIPE_SECRET_KEY = stripeSecret;
process.env.STRIPE_WEBHOOK_SECRET = stripeWebhookSecret;
process.env.STRIPE_PRICE_PERSONAL = stripePricePersonal;
process.env.STRIPE_PRICE_BUSINESS = stripePriceBusiness;
process.env.BILLING_RESELLER_CONTACT_URL = resellerContact;
process.env.JOB_LEASE_MS = '5000';
process.env.PLATFORM_ADMIN_SECRET = platformAdminSecret;

// When the harness boots Next in dev mode, Next sets NODE_ENV=development and
// the config module reads APP_* keys — keep both shapes populated for tests.
process.env.APP_NODE_ENV = 'development';
process.env.APP_PORT = '43128';
process.env.APP_BASE_URL = baseUrl;
process.env.APP_LOG_LEVEL = 'info';
process.env.APP_EDITION = 'cloud';
process.env.APP_DATABASE_URL = databaseUrl;
process.env.APP_AUTH_SECRET = authSecret;
process.env.APP_STRIPE_SECRET_KEY = stripeSecret;
process.env.APP_STRIPE_WEBHOOK_SECRET = stripeWebhookSecret;
process.env.APP_STRIPE_PRICE_PERSONAL = stripePricePersonal;
process.env.APP_STRIPE_PRICE_BUSINESS = stripePriceBusiness;
process.env.APP_BILLING_RESELLER_CONTACT_URL = resellerContact;
process.env.APP_JOB_LEASE_MS = '5000';
process.env.APP_PLATFORM_ADMIN_SECRET = platformAdminSecret;
