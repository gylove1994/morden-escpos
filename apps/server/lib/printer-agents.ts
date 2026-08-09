/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from './db';
import {
  printerAgent,
  type PrinterAgentRow,
  type PrinterAgentStatus,
} from './db/schema';
import {
  deviceTokenPrefix,
  generateDeviceToken,
  hashDeviceToken,
} from './device-token';

export type PrinterAgentPublic = {
  id: string
  organizationId: string
  name: string
  status: PrinterAgentStatus
  deviceTokenPrefix: string | null
  createdAt: string
  updatedAt: string
  revokedAt: string | null
  lastAuthenticatedAt: string | null
};

function toPublic(row: PrinterAgentRow): PrinterAgentPublic {
  const status: PrinterAgentStatus = row.status === 'revoked' ? 'revoked' : 'active';
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    status,
    deviceTokenPrefix: row.deviceTokenPrefix,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
    lastAuthenticatedAt: row.lastAuthenticatedAt?.toISOString() ?? null,
  };
}

export async function listPrinterAgents(
  organizationId: string,
): Promise<PrinterAgentPublic[]> {
  const rows = await db
    .select()
    .from(printerAgent)
    .where(eq(printerAgent.organizationId, organizationId))
    .orderBy(desc(printerAgent.createdAt));
  return rows.map(toPublic);
}

export async function createPrinterAgent(input: {
  organizationId: string
  name: string
}): Promise<{ printerAgent: PrinterAgentPublic, deviceToken: string }> {
  const deviceToken = generateDeviceToken();
  const now = new Date();
  const id = randomUUID();

  const [row] = await db
    .insert(printerAgent)
    .values({
      id,
      organizationId: input.organizationId,
      name: input.name,
      status: 'active',
      deviceTokenHash: hashDeviceToken(deviceToken),
      deviceTokenPrefix: deviceTokenPrefix(deviceToken),
      createdAt: now,
      updatedAt: now,
      revokedAt: null,
      lastAuthenticatedAt: null,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to create Printer Agent');
  }

  return { printerAgent: toPublic(row), deviceToken };
}

export async function revokePrinterAgent(input: {
  organizationId: string
  printerAgentId: string
}): Promise<PrinterAgentPublic | null> {
  const now = new Date();
  const [row] = await db
    .update(printerAgent)
    .set({
      status: 'revoked',
      deviceTokenHash: null,
      updatedAt: now,
      revokedAt: now,
    })
    .where(
      and(
        eq(printerAgent.id, input.printerAgentId),
        eq(printerAgent.organizationId, input.organizationId),
      ),
    )
    .returning();

  return row ? toPublic(row) : null;
}

export async function rotatePrinterAgentToken(input: {
  organizationId: string
  printerAgentId: string
}): Promise<{ printerAgent: PrinterAgentPublic, deviceToken: string } | null> {
  const existing = await db
    .select()
    .from(printerAgent)
    .where(
      and(
        eq(printerAgent.id, input.printerAgentId),
        eq(printerAgent.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  const deviceToken = generateDeviceToken();
  const now = new Date();
  const [row] = await db
    .update(printerAgent)
    .set({
      status: 'active',
      deviceTokenHash: hashDeviceToken(deviceToken),
      deviceTokenPrefix: deviceTokenPrefix(deviceToken),
      updatedAt: now,
      revokedAt: null,
    })
    .where(
      and(
        eq(printerAgent.id, input.printerAgentId),
        eq(printerAgent.organizationId, input.organizationId),
      ),
    )
    .returning();

  if (!row) {
    return null;
  }

  return { printerAgent: toPublic(row), deviceToken };
}

/**
 * Authenticate a Printer Agent by plaintext device token.
 * Returns null for missing, invalid, or revoked tokens.
 */
export async function authenticatePrinterAgentDeviceToken(
  token: string,
): Promise<PrinterAgentPublic | null> {
  if (!token || !token.startsWith('pa_')) {
    return null;
  }

  const tokenHash = hashDeviceToken(token);
  const rows = await db
    .select()
    .from(printerAgent)
    .where(
      and(
        eq(printerAgent.deviceTokenHash, tokenHash),
        eq(printerAgent.status, 'active'),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const now = new Date();
  await db
    .update(printerAgent)
    .set({ lastAuthenticatedAt: now, updatedAt: now })
    .where(eq(printerAgent.id, row.id));

  return toPublic({ ...row, lastAuthenticatedAt: now, updatedAt: now });
}
