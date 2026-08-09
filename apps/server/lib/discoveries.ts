/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { and, desc, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  type ConnectionHints,
  parseConnectionHintsJson,
  stringifyConnectionHints,
} from './connection-hints';
import { db } from './db';
import {
  printerDiscovery,
  type PrinterDiscoveryRow,
} from './db/schema';
import { createPrinter, type PrinterPublic } from './printers';

export type DiscoveredEndpointInput = {
  connectionHints: ConnectionHints
  suggestedName?: string | null
};

export type PrinterDiscoveryPublic = {
  id: string
  organizationId: string
  printerAgentId: string
  endpointKey: string
  connectionHints: ConnectionHints
  suggestedName: string | null
  firstSeenAt: string
  lastSeenAt: string
  confirmedPrinterId: string | null
  createdAt: string
  updatedAt: string
};

/**
 * Stable endpoint fingerprint used for discovery upserts.
 */
export function endpointKeyFromHints(hints: ConnectionHints): string {
  if (hints.transport === 'tcp') {
    return `tcp://${hints.address.trim().toLowerCase()}:${hints.port}`;
  }
  if (hints.transport === 'serial') {
    return `serial://${hints.path.trim()}`;
  }
  return `usb://${hints.path.trim()}`;
}

function toPublic(row: PrinterDiscoveryRow): PrinterDiscoveryPublic {
  return {
    id: row.id,
    organizationId: row.organizationId,
    printerAgentId: row.printerAgentId,
    endpointKey: row.endpointKey,
    connectionHints: parseConnectionHintsJson(row.connectionHintsJson),
    suggestedName: row.suggestedName,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    confirmedPrinterId: row.confirmedPrinterId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Upsert discovered endpoints reported by a Printer Agent.
 * Re-reporting the same endpointKey refreshes lastSeenAt and connection hints.
 */
export async function reportDiscoveries(input: {
  organizationId: string
  printerAgentId: string
  endpoints: DiscoveredEndpointInput[]
}): Promise<PrinterDiscoveryPublic[]> {
  const now = new Date();
  const results: PrinterDiscoveryPublic[] = [];

  for (const endpoint of input.endpoints) {
    const endpointKey = endpointKeyFromHints(endpoint.connectionHints);
    const suggestedName = endpoint.suggestedName?.trim() || null;
    const connectionHintsJson = stringifyConnectionHints(endpoint.connectionHints);

    const existing = await db
      .select()
      .from(printerDiscovery)
      .where(
        and(
          eq(printerDiscovery.printerAgentId, input.printerAgentId),
          eq(printerDiscovery.endpointKey, endpointKey),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const [row] = await db
        .update(printerDiscovery)
        .set({
          connectionHintsJson,
          suggestedName: suggestedName ?? existing[0].suggestedName,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(printerDiscovery.id, existing[0].id))
        .returning();
      if (row) {
        results.push(toPublic(row));
      }
      continue;
    }

    const [row] = await db
      .insert(printerDiscovery)
      .values({
        id: randomUUID(),
        organizationId: input.organizationId,
        printerAgentId: input.printerAgentId,
        endpointKey,
        connectionHintsJson,
        suggestedName,
        firstSeenAt: now,
        lastSeenAt: now,
        confirmedPrinterId: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (row) {
      results.push(toPublic(row));
    }
  }

  return results;
}

export async function listDiscoveries(input: {
  organizationId: string
  pendingOnly?: boolean
}): Promise<PrinterDiscoveryPublic[]> {
  const rows = await db
    .select()
    .from(printerDiscovery)
    .where(
      input.pendingOnly
        ? and(
            eq(printerDiscovery.organizationId, input.organizationId),
            isNull(printerDiscovery.confirmedPrinterId),
          )
        : eq(printerDiscovery.organizationId, input.organizationId),
    )
    .orderBy(desc(printerDiscovery.lastSeenAt));

  return rows.map(toPublic);
}

export async function getDiscovery(input: {
  organizationId: string
  discoveryId: string
}): Promise<PrinterDiscoveryPublic | null> {
  const rows = await db
    .select()
    .from(printerDiscovery)
    .where(
      and(
        eq(printerDiscovery.id, input.discoveryId),
        eq(printerDiscovery.organizationId, input.organizationId),
      ),
    )
    .limit(1);
  return rows[0] ? toPublic(rows[0]) : null;
}

/**
 * Confirm a pending discovery into a named Printer under its Printer Agent.
 */
export async function confirmDiscovery(input: {
  organizationId: string
  discoveryId: string
  name: string
}): Promise<{ discovery: PrinterDiscoveryPublic, printer: PrinterPublic }> {
  const rows = await db
    .select()
    .from(printerDiscovery)
    .where(
      and(
        eq(printerDiscovery.id, input.discoveryId),
        eq(printerDiscovery.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new DiscoveryNotFoundError();
  }

  if (row.confirmedPrinterId) {
    throw new DiscoveryAlreadyConfirmedError();
  }

  const printer = await createPrinter({
    organizationId: input.organizationId,
    printerAgentId: row.printerAgentId,
    name: input.name,
    connectionHints: parseConnectionHintsJson(row.connectionHintsJson),
  });

  const now = new Date();
  const [updated] = await db
    .update(printerDiscovery)
    .set({
      confirmedPrinterId: printer.id,
      updatedAt: now,
    })
    .where(eq(printerDiscovery.id, row.id))
    .returning();

  if (!updated) {
    throw new Error('Failed to confirm discovery');
  }

  return { discovery: toPublic(updated), printer };
}

export class DiscoveryNotFoundError extends Error {
  constructor() {
    super('Printer discovery not found in Organization');
    this.name = 'DiscoveryNotFoundError';
  }
}

export class DiscoveryAlreadyConfirmedError extends Error {
  constructor() {
    super('Printer discovery is already confirmed');
    this.name = 'DiscoveryAlreadyConfirmedError';
  }
}
