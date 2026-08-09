/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { WebhookSigningSecretRow, WebhookSigningSecretStatus } from './db/schema';
import { Buffer } from 'node:buffer';
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from './db';
import { webhookSigningSecret } from './db/schema';
import { decryptSecret, encryptSecret } from './secret-crypto';

/** Webhook secrets are distinct from device tokens (`pa_`) and API keys (`ik_`). */
export const WEBHOOK_SECRET_PREFIX = 'whsec_';

/** Max age for signed webhook timestamps (replay window). */
export const WEBHOOK_SIGNATURE_MAX_SKEW_MS = 5 * 60 * 1000;

/**
 * Generate a high-entropy webhook signing secret.
 * Format: `whsec_` + base64url(32 random bytes).
 */
export function generateWebhookSecret(): string {
  return `${WEBHOOK_SECRET_PREFIX}${randomBytes(32).toString('base64url')}`;
}

/** SHA-256 hex digest for shared-secret header lookup. */
export function hashWebhookSecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

/** Short non-secret label for console lists. */
export function webhookSecretPrefix(secret: string): string {
  return secret.slice(0, 12);
}

/**
 * Canonical signed-payload string: `${timestamp}.${rawBody}`.
 */
export function webhookSignedPayload(timestamp: string, rawBody: string): string {
  return `${timestamp}.${rawBody}`;
}

/** HMAC-SHA256 hex digest of the signed payload. */
export function signWebhookPayload(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret)
    .update(webhookSignedPayload(timestamp, rawBody), 'utf8')
    .digest('hex');
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a, 'hex');
    const right = Buffer.from(b, 'hex');
    if (left.length === 0 || left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  }
  catch {
    return false;
  }
}

export interface WebhookSigningSecretPublic {
  id: string
  organizationId: string
  name: string
  status: WebhookSigningSecretStatus
  secretPrefix: string | null
  createdAt: string
  updatedAt: string
  revokedAt: string | null
  lastAuthenticatedAt: string | null
}

function toPublic(row: WebhookSigningSecretRow): WebhookSigningSecretPublic {
  const status: WebhookSigningSecretStatus = row.status === 'revoked' ? 'revoked' : 'active';
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    status,
    secretPrefix: row.secretPrefix,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
    lastAuthenticatedAt: row.lastAuthenticatedAt?.toISOString() ?? null,
  };
}

export async function listWebhookSigningSecrets(
  organizationId: string,
): Promise<WebhookSigningSecretPublic[]> {
  const rows = await db
    .select()
    .from(webhookSigningSecret)
    .where(eq(webhookSigningSecret.organizationId, organizationId))
    .orderBy(desc(webhookSigningSecret.createdAt));
  return rows.map(toPublic);
}

export async function createWebhookSigningSecret(input: {
  organizationId: string
  name: string
}): Promise<{ webhookSecret: WebhookSigningSecretPublic, secret: string }> {
  const secret = generateWebhookSecret();
  const now = new Date();
  const id = randomUUID();

  const [row] = await db
    .insert(webhookSigningSecret)
    .values({
      id,
      organizationId: input.organizationId,
      name: input.name,
      status: 'active',
      secretHash: hashWebhookSecret(secret),
      secretEncrypted: encryptSecret(secret),
      secretPrefix: webhookSecretPrefix(secret),
      createdAt: now,
      updatedAt: now,
      revokedAt: null,
      lastAuthenticatedAt: null,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to create webhook signing secret');
  }

  return { webhookSecret: toPublic(row), secret };
}

export async function revokeWebhookSigningSecret(input: {
  organizationId: string
  webhookSecretId: string
}): Promise<WebhookSigningSecretPublic | null> {
  const now = new Date();
  const [row] = await db
    .update(webhookSigningSecret)
    .set({
      status: 'revoked',
      secretHash: null,
      secretEncrypted: null,
      updatedAt: now,
      revokedAt: now,
    })
    .where(
      and(
        eq(webhookSigningSecret.id, input.webhookSecretId),
        eq(webhookSigningSecret.organizationId, input.organizationId),
      ),
    )
    .returning();

  return row ? toPublic(row) : null;
}

async function touchAuthenticated(row: WebhookSigningSecretRow): Promise<WebhookSigningSecretPublic> {
  const now = new Date();
  await db
    .update(webhookSigningSecret)
    .set({ lastAuthenticatedAt: now, updatedAt: now })
    .where(eq(webhookSigningSecret.id, row.id));
  return toPublic({ ...row, lastAuthenticatedAt: now, updatedAt: now });
}

/**
 * Authenticate via shared-secret header value.
 * Printer Agent device tokens and integrator API keys MUST NOT authenticate here.
 */
export async function authenticateWebhookSharedSecret(
  secret: string,
): Promise<WebhookSigningSecretPublic | null> {
  if (!secret || !secret.startsWith(WEBHOOK_SECRET_PREFIX)) {
    return null;
  }

  const secretHash = hashWebhookSecret(secret);
  const rows = await db
    .select()
    .from(webhookSigningSecret)
    .where(
      and(
        eq(webhookSigningSecret.secretHash, secretHash),
        eq(webhookSigningSecret.status, 'active'),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return touchAuthenticated(row);
}

/**
 * Authenticate a signed webhook request by credential id + HMAC signature.
 */
export async function authenticateWebhookSignedRequest(input: {
  webhookSecretId: string
  timestamp: string
  signatureHex: string
  rawBody: string
  nowMs?: number
}): Promise<WebhookSigningSecretPublic | null> {
  if (!/^\d+$/.test(input.timestamp)) {
    return null;
  }

  const tsMs = Number(input.timestamp) * 1000;
  const nowMs = input.nowMs ?? Date.now();
  if (!Number.isFinite(tsMs) || Math.abs(nowMs - tsMs) > WEBHOOK_SIGNATURE_MAX_SKEW_MS) {
    return null;
  }

  const rows = await db
    .select()
    .from(webhookSigningSecret)
    .where(
      and(
        eq(webhookSigningSecret.id, input.webhookSecretId),
        eq(webhookSigningSecret.status, 'active'),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row?.secretEncrypted) {
    return null;
  }

  let plaintext: string;
  try {
    plaintext = decryptSecret(row.secretEncrypted);
  }
  catch {
    return null;
  }

  if (!plaintext.startsWith(WEBHOOK_SECRET_PREFIX)) {
    return null;
  }

  const expected = signWebhookPayload(plaintext, input.timestamp, input.rawBody);
  if (!timingSafeEqualHex(expected, input.signatureHex)) {
    return null;
  }

  return touchAuthenticated(row);
}
