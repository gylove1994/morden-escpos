/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  type ConnectionHints,
  parseConnectionHintsJson,
  stringifyConnectionHints,
} from './connection-hints';
import { db } from './db';
import {
  printer,
  printerAgent,
  type PrinterRow,
  type PrinterStatus,
} from './db/schema';

export type PrinterPublic = {
  id: string
  organizationId: string
  printerAgentId: string
  name: string
  status: PrinterStatus
  connectionHints: ConnectionHints
  createdAt: string
  updatedAt: string
};

function toPublic(row: PrinterRow): PrinterPublic {
  const status: PrinterStatus = row.status === 'disabled' ? 'disabled' : 'active';
  return {
    id: row.id,
    organizationId: row.organizationId,
    printerAgentId: row.printerAgentId,
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
    .select()
    .from(printer)
    .where(eq(printer.organizationId, organizationId))
    .orderBy(desc(printer.createdAt));
  return rows.map(toPublic);
}

export async function getPrinter(input: {
  organizationId: string
  printerId: string
}): Promise<PrinterPublic | null> {
  const rows = await db
    .select()
    .from(printer)
    .where(
      and(
        eq(printer.id, input.printerId),
        eq(printer.organizationId, input.organizationId),
      ),
    )
    .limit(1);
  return rows[0] ? toPublic(rows[0]) : null;
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

  if (agents.length === 0) {
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

  return toPublic(row);
}

export class PrinterAgentNotFoundError extends Error {
  constructor() {
    super('Active Printer Agent not found in Organization');
    this.name = 'PrinterAgentNotFoundError';
  }
}
