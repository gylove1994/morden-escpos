/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { organization } from 'better-auth/plugins';
import { SERVER_CONFIG } from './config';
import { db } from './db';
import * as schema from './db/schema';

/**
 * Human session authentication (email/password + Organization RBAC).
 *
 * This MUST remain distinct from future Printer Agent device-token auth (#4).
 * Device tokens authenticate on-site Printer Agents; they MUST NOT reuse session cookies.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),
  secret: SERVER_CONFIG.AUTH_SECRET,
  baseURL: SERVER_CONFIG.BASE_URL,
  trustedOrigins: [SERVER_CONFIG.BASE_URL],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      // Creator becomes Organization owner (RBAC: owner | admin | member).
      creatorRole: 'owner',
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
