/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from './db';
import {
  printer,
  printerAgent,
  printerGroup,
  printerGroupMember,
  type PrinterGroupRow,
} from './db/schema';

export type PrinterGroupPublic = {
  id: string
  organizationId: string
  printerAgentId: string
  name: string
  printerIds: string[]
  createdAt: string
  updatedAt: string
};

function toPublic(row: PrinterGroupRow, printerIds: string[]): PrinterGroupPublic {
  return {
    id: row.id,
    organizationId: row.organizationId,
    printerAgentId: row.printerAgentId,
    name: row.name,
    printerIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function loadPrinterIds(printerGroupId: string): Promise<string[]> {
  const rows = await db
    .select({ printerId: printerGroupMember.printerId })
    .from(printerGroupMember)
    .where(eq(printerGroupMember.printerGroupId, printerGroupId));
  return rows.map(row => row.printerId);
}

export async function listPrinterGroups(
  organizationId: string,
): Promise<PrinterGroupPublic[]> {
  const groups = await db
    .select()
    .from(printerGroup)
    .where(eq(printerGroup.organizationId, organizationId))
    .orderBy(desc(printerGroup.createdAt));

  if (groups.length === 0) {
    return [];
  }

  const memberships = await db
    .select({
      printerGroupId: printerGroupMember.printerGroupId,
      printerId: printerGroupMember.printerId,
    })
    .from(printerGroupMember)
    .where(
      inArray(
        printerGroupMember.printerGroupId,
        groups.map(group => group.id),
      ),
    );

  const idsByGroup = new Map<string, string[]>();
  for (const membership of memberships) {
    const list = idsByGroup.get(membership.printerGroupId) ?? [];
    list.push(membership.printerId);
    idsByGroup.set(membership.printerGroupId, list);
  }

  return groups.map(group => toPublic(group, idsByGroup.get(group.id) ?? []));
}

export async function getPrinterGroup(input: {
  organizationId: string
  printerGroupId: string
}): Promise<PrinterGroupPublic | null> {
  const rows = await db
    .select()
    .from(printerGroup)
    .where(
      and(
        eq(printerGroup.id, input.printerGroupId),
        eq(printerGroup.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  const group = rows[0];
  if (!group) {
    return null;
  }

  return toPublic(group, await loadPrinterIds(group.id));
}

/**
 * Resolve active Printer members for a Printer Group at enqueue time.
 * Returns null when the group is missing from the Organization.
 */
export async function resolveActiveGroupPrinters(input: {
  organizationId: string
  printerGroupId: string
}): Promise<{
  group: PrinterGroupRow
  printers: Array<{ id: string, printerAgentId: string }>
} | null> {
  const groups = await db
    .select()
    .from(printerGroup)
    .where(
      and(
        eq(printerGroup.id, input.printerGroupId),
        eq(printerGroup.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  const group = groups[0];
  if (!group) {
    return null;
  }

  const members = await db
    .select({
      id: printer.id,
      printerAgentId: printer.printerAgentId,
      status: printer.status,
    })
    .from(printerGroupMember)
    .innerJoin(printer, eq(printer.id, printerGroupMember.printerId))
    .where(eq(printerGroupMember.printerGroupId, group.id));

  const active = members.filter(
    member =>
      member.status === 'active'
      && member.printerAgentId === group.printerAgentId,
  );

  return {
    group,
    printers: active.map(member => ({
      id: member.id,
      printerAgentId: member.printerAgentId,
    })),
  };
}

async function assertPrintersBelongToAgent(input: {
  organizationId: string
  printerAgentId: string
  printerIds: string[]
}): Promise<void> {
  const uniqueIds = [...new Set(input.printerIds)];
  if (uniqueIds.length === 0) {
    return;
  }

  const rows = await db
    .select()
    .from(printer)
    .where(
      and(
        eq(printer.organizationId, input.organizationId),
        eq(printer.printerAgentId, input.printerAgentId),
        inArray(printer.id, uniqueIds),
      ),
    );

  if (rows.length !== uniqueIds.length) {
    throw new PrinterGroupMemberInvalidError(
      'All Printers in a Printer Group MUST belong to the same Printer Agent',
    );
  }
}

/**
 * Create a Printer Group under an active Printer Agent.
 * Membership MAY be empty at create time; enqueue fails fast on empty groups.
 */
export async function createPrinterGroup(input: {
  organizationId: string
  printerAgentId: string
  name: string
  printerIds?: string[]
}): Promise<PrinterGroupPublic> {
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
    throw new PrinterAgentNotFoundForGroupError();
  }

  const printerIds = [...new Set(input.printerIds ?? [])];
  await assertPrintersBelongToAgent({
    organizationId: input.organizationId,
    printerAgentId: input.printerAgentId,
    printerIds,
  });

  const now = new Date();
  const groupId = randomUUID();

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(printerGroup)
      .values({
        id: groupId,
        organizationId: input.organizationId,
        printerAgentId: input.printerAgentId,
        name: input.name,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create Printer Group');
    }

    if (printerIds.length > 0) {
      await tx.insert(printerGroupMember).values(
        printerIds.map(printerId => ({
          id: randomUUID(),
          printerGroupId: groupId,
          printerId,
          createdAt: now,
        })),
      );
    }

    return toPublic(row, printerIds);
  });
}

/**
 * Update Printer Group name and/or replace membership under the same Printer Agent.
 */
export async function updatePrinterGroup(input: {
  organizationId: string
  printerGroupId: string
  name?: string
  printerIds?: string[]
}): Promise<PrinterGroupPublic> {
  const groups = await db
    .select()
    .from(printerGroup)
    .where(
      and(
        eq(printerGroup.id, input.printerGroupId),
        eq(printerGroup.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  const existing = groups[0];
  if (!existing) {
    throw new PrinterGroupNotFoundError();
  }

  if (input.name === undefined && input.printerIds === undefined) {
    return toPublic(existing, await loadPrinterIds(existing.id));
  }

  const printerIds = input.printerIds === undefined
    ? null
    : [...new Set(input.printerIds)];

  if (printerIds) {
    await assertPrintersBelongToAgent({
      organizationId: input.organizationId,
      printerAgentId: existing.printerAgentId,
      printerIds,
    });
  }

  const now = new Date();

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(printerGroup)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        updatedAt: now,
      })
      .where(eq(printerGroup.id, existing.id))
      .returning();

    if (!row) {
      throw new PrinterGroupNotFoundError();
    }

    if (printerIds) {
      await tx
        .delete(printerGroupMember)
        .where(eq(printerGroupMember.printerGroupId, existing.id));

      if (printerIds.length > 0) {
        await tx.insert(printerGroupMember).values(
          printerIds.map(printerId => ({
            id: randomUUID(),
            printerGroupId: existing.id,
            printerId,
            createdAt: now,
          })),
        );
      }

      return toPublic(row, printerIds);
    }

    return toPublic(row, await loadPrinterIds(existing.id));
  });
}

export class PrinterAgentNotFoundForGroupError extends Error {
  constructor() {
    super('Active Printer Agent not found in Organization');
    this.name = 'PrinterAgentNotFoundForGroupError';
  }
}

export class PrinterGroupNotFoundError extends Error {
  constructor() {
    super('Printer Group not found in Organization');
    this.name = 'PrinterGroupNotFoundError';
  }
}

export class PrinterGroupMemberInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrinterGroupMemberInvalidError';
  }
}
