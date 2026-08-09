/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { IntegratorApiKeyRow, IntegratorApiKeyStatus } from './db/schema';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from './db';
import { integratorApiKey } from './db/schema';

/** Integrator API keys are distinct from device tokens (`pa_`) and webhook secrets (`whsec_`). */
export const INTEGRATOR_API_KEY_PREFIX = 'ik_';

/**
 * Generate a high-entropy integrator API key.
 * Format: `ik_` + base64url(32 random bytes).
 */
export function generateIntegratorApiKey(): string {
  return `${INTEGRATOR_API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
}

/** SHA-256 hex digest for at-rest storage. */
export function hashIntegratorApiKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

/** Short non-secret label for console lists (never reconstructs the key). */
export function integratorApiKeyPrefix(key: string): string {
  return key.slice(0, 10);
}

export interface IntegratorApiKeyPublic {
  id: string
  organizationId: string
  name: string
  status: IntegratorApiKeyStatus
  keyPrefix: string | null
  createdAt: string
  updatedAt: string
  revokedAt: string | null
  lastAuthenticatedAt: string | null
}

function toPublic(row: IntegratorApiKeyRow): IntegratorApiKeyPublic {
  const status: IntegratorApiKeyStatus = row.status === 'revoked' ? 'revoked' : 'active';
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    status,
    keyPrefix: row.keyPrefix,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
    lastAuthenticatedAt: row.lastAuthenticatedAt?.toISOString() ?? null,
  };
}

export async function listIntegratorApiKeys(
  organizationId: string,
): Promise<IntegratorApiKeyPublic[]> {
  const rows = await db
    .select()
    .from(integratorApiKey)
    .where(eq(integratorApiKey.organizationId, organizationId))
    .orderBy(desc(integratorApiKey.createdAt));
  return rows.map(toPublic);
}

export async function createIntegratorApiKey(input: {
  organizationId: string
  name: string
}): Promise<{ apiKey: IntegratorApiKeyPublic, token: string }> {
  const token = generateIntegratorApiKey();
  const now = new Date();
  const id = randomUUID();

  const [row] = await db
    .insert(integratorApiKey)
    .values({
      id,
      organizationId: input.organizationId,
      name: input.name,
      status: 'active',
      keyHash: hashIntegratorApiKey(token),
      keyPrefix: integratorApiKeyPrefix(token),
      createdAt: now,
      updatedAt: now,
      revokedAt: null,
      lastAuthenticatedAt: null,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to create integrator API key');
  }

  return { apiKey: toPublic(row), token };
}

export async function revokeIntegratorApiKey(input: {
  organizationId: string
  apiKeyId: string
}): Promise<IntegratorApiKeyPublic | null> {
  const now = new Date();
  const [row] = await db
    .update(integratorApiKey)
    .set({
      status: 'revoked',
      keyHash: null,
      updatedAt: now,
      revokedAt: now,
    })
    .where(
      and(
        eq(integratorApiKey.id, input.apiKeyId),
        eq(integratorApiKey.organizationId, input.organizationId),
      ),
    )
    .returning();

  return row ? toPublic(row) : null;
}

/**
 * Authenticate an integrator by plaintext API key.
 * Returns null for missing, wrong-prefix, invalid, or revoked keys.
 * Printer Agent device tokens and webhook secrets MUST NOT authenticate here.
 */
export async function authenticateIntegratorApiKey(
  token: string,
): Promise<IntegratorApiKeyPublic | null> {
  if (!token || !token.startsWith(INTEGRATOR_API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashIntegratorApiKey(token);
  const rows = await db
    .select()
    .from(integratorApiKey)
    .where(
      and(
        eq(integratorApiKey.keyHash, keyHash),
        eq(integratorApiKey.status, 'active'),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const now = new Date();
  await db
    .update(integratorApiKey)
    .set({ lastAuthenticatedAt: now, updatedAt: now })
    .where(eq(integratorApiKey.id, row.id));

  return toPublic({ ...row, lastAuthenticatedAt: now, updatedAt: now });
}
