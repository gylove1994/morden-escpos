/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ConnectionHints } from './connection-hints';
import type { PrinterRow, PrinterStatus } from './db/schema';
import type { PresenceStatus } from './presence';
import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import {
  parseConnectionHintsJson,
  stringifyConnectionHints,
} from './connection-hints';
import { db } from './db';
import { printer, printerAgent } from './db/schema';
import { presenceFromLastSeen } from './presence';

export interface PrinterPublic {
  id: string
  organizationId: string
  printerAgentId: string
  printerAgentName: string
  printerAgentPresence: PresenceStatus
  printerAgentLastAuthenticatedAt: string | null
  name: string
  status: PrinterStatus
  connectionHints: ConnectionHints
  createdAt: string
  updatedAt: string
}

function toPublic(
  row: PrinterRow,
  agent: {
    name: string
    lastAuthenticatedAt: Date | null
  },
): PrinterPublic {
  const status: PrinterStatus = row.status === 'disabled' ? 'disabled' : 'active';
  return {
    id: row.id,
    organizationId: row.organizationId,
    printerAgentId: row.printerAgentId,
    printerAgentName: agent.name,
    printerAgentPresence: presenceFromLastSeen(agent.lastAuthenticatedAt),
    printerAgentLastAuthenticatedAt: agent.lastAuthenticatedAt?.toISOString() ?? null,
    name: row.name,
    status,
    connectionHints: parseConnectionHintsJson(row.connectionHintsJson),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listPrinters(
  organizationId: string,
): Promise<PrinterPublic[]> {
  const rows = await db
    .select({
      printer,
      agentName: printerAgent.name,
      agentLastAuthenticatedAt: printerAgent.lastAuthenticatedAt,
    })
    .from(printer)
    .innerJoin(printerAgent, eq(printer.printerAgentId, printerAgent.id))
    .where(eq(printer.organizationId, organizationId))
    .orderBy(desc(printer.createdAt));

  return rows.map(row => toPublic(row.printer, {
    name: row.agentName,
    lastAuthenticatedAt: row.agentLastAuthenticatedAt,
  }));
}

export async function getPrinter(input: {
  organizationId: string
  printerId: string
}): Promise<PrinterPublic | null> {
  const rows = await db
    .select({
      printer,
      agentName: printerAgent.name,
      agentLastAuthenticatedAt: printerAgent.lastAuthenticatedAt,
    })
    .from(printer)
    .innerJoin(printerAgent, eq(printer.printerAgentId, printerAgent.id))
    .where(
      and(
        eq(printer.id, input.printerId),
        eq(printer.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toPublic(row.printer, {
    name: row.agentName,
    lastAuthenticatedAt: row.agentLastAuthenticatedAt,
  });
}

/**
 * Create/confirm a Printer under an active Printer Agent in the Organization.
 */
export async function createPrinter(input: {
  organizationId: string
  printerAgentId: string
  name: string
  connectionHints: ConnectionHints
}): Promise<PrinterPublic> {
  const agents = await db
    .select()
    .from(printerAgent)
    .where(
      and(
        eq(printerAgent.id, input.printerAgentId),
        eq(printerAgent.organizationId, input.organizationId),
        eq(printerAgent.status, 'active'),
      ),
    )
    .limit(1);

  const agent = agents[0];
  if (!agent) {
    throw new PrinterAgentNotFoundError();
  }

  const now = new Date();
  const [row] = await db
    .insert(printer)
    .values({
      id: randomUUID(),
      organizationId: input.organizationId,
      printerAgentId: input.printerAgentId,
      name: input.name,
      status: 'active',
      connectionHintsJson: stringifyConnectionHints(input.connectionHints),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to create Printer');
  }

  return toPublic(row, {
    name: agent.name,
    lastAuthenticatedAt: agent.lastAuthenticatedAt,
  });
}

/**
 * Disable a Printer without deleting it or its job history.
 * Disabled Printers MUST NOT accept new enqueue.
 */
export async function disablePrinter(input: {
  organizationId: string
  printerId: string
}): Promise<PrinterPublic | null> {
  const existing = await getPrinter(input);
  if (!existing) {
    return null;
  }

  if (existing.status === 'disabled') {
    return existing;
  }

  const now = new Date();
  const [row] = await db
    .update(printer)
    .set({
      status: 'disabled',
      updatedAt: now,
    })
    .where(
      and(
        eq(printer.id, input.printerId),
        eq(printer.organizationId, input.organizationId),
      ),
    )
    .returning();

  if (!row) {
    return null;
  }

  return toPublic(row, {
    name: existing.printerAgentName,
    lastAuthenticatedAt: existing.printerAgentLastAuthenticatedAt
      ? new Date(existing.printerAgentLastAuthenticatedAt)
      : null,
  });
}

export class PrinterAgentNotFoundError extends Error {
  constructor() {
    super('Active Printer Agent not found in Organization');
    this.name = 'PrinterAgentNotFoundError';
  }
}
