/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { PrintJobJSON } from 'morden-node-escpos/schema';
import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from './db';
import { printTemplate, type PrintTemplateRow } from './db/schema';

export type PrintTemplatePublic = {
  id: string
  organizationId: string
  name: string
  definition: PrintJobJSON
  createdAt: string
  updatedAt: string
};

export class InvalidTemplateDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTemplateDefinitionError';
  }
}

export class TemplateNotFoundError extends Error {
  constructor(message = 'Template not found in Organization') {
    super(message);
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Validate and normalize a stored PrintJobJSON template definition.
 * Full input/render correctness stays in MIT `morden-node-escpos`;
 * this only enforces the SaaS storage shape.
 */
export function parseTemplateDefinition(value: unknown): PrintJobJSON {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidTemplateDefinitionError('Template definition must be a JSON object');
  }

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.commands)) {
    throw new InvalidTemplateDefinitionError('Template definition.commands must be an array');
  }
  if (record.commands.length === 0) {
    throw new InvalidTemplateDefinitionError('Template definition.commands must not be empty');
  }
  for (const command of record.commands) {
    if (
      command === null
      || typeof command !== 'object'
      || Array.isArray(command)
      || typeof (command as { type?: unknown }).type !== 'string'
      || !(command as { type: string }).type.trim()
    ) {
      throw new InvalidTemplateDefinitionError(
        'Each template command must be an object with a non-empty type',
      );
    }
  }

  if (record.inputs !== undefined) {
    if (
      record.inputs === null
      || typeof record.inputs !== 'object'
      || Array.isArray(record.inputs)
    ) {
      throw new InvalidTemplateDefinitionError(
        'Template definition.inputs must be a JSON Schema object when set',
      );
    }
  }

  return value as PrintJobJSON;
}

function toPublic(row: PrintTemplateRow): PrintTemplatePublic {
  let definition: PrintJobJSON;
  try {
    definition = parseTemplateDefinition(JSON.parse(row.definitionJson) as unknown);
  }
  catch {
    // Stored rows were validated on write; surface a stable shape if corrupted.
    definition = { commands: [] };
  }

  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    definition,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listTemplates(
  organizationId: string,
): Promise<PrintTemplatePublic[]> {
  const rows = await db
    .select()
    .from(printTemplate)
    .where(eq(printTemplate.organizationId, organizationId))
    .orderBy(desc(printTemplate.createdAt));
  return rows.map(toPublic);
}

export async function getTemplate(input: {
  organizationId: string
  templateId: string
}): Promise<PrintTemplatePublic | null> {
  const rows = await db
    .select()
    .from(printTemplate)
    .where(
      and(
        eq(printTemplate.id, input.templateId),
        eq(printTemplate.organizationId, input.organizationId),
      ),
    )
    .limit(1);
  return rows[0] ? toPublic(rows[0]) : null;
}

export async function createTemplate(input: {
  organizationId: string
  name: string
  definition: unknown
}): Promise<PrintTemplatePublic> {
  const definition = parseTemplateDefinition(input.definition);
  const name = input.name.trim();
  if (!name) {
    throw new InvalidTemplateDefinitionError('Template name is required');
  }

  const now = new Date();
  const [row] = await db
    .insert(printTemplate)
    .values({
      id: randomUUID(),
      organizationId: input.organizationId,
      name,
      definitionJson: JSON.stringify(definition),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to create template');
  }

  return toPublic(row);
}

export async function updateTemplate(input: {
  organizationId: string
  templateId: string
  name?: string
  definition?: unknown
}): Promise<PrintTemplatePublic> {
  const existing = await getTemplate({
    organizationId: input.organizationId,
    templateId: input.templateId,
  });
  if (!existing) {
    throw new TemplateNotFoundError();
  }

  const name = input.name !== undefined ? input.name.trim() : existing.name;
  if (!name) {
    throw new InvalidTemplateDefinitionError('Template name is required');
  }

  const definition = input.definition !== undefined
    ? parseTemplateDefinition(input.definition)
    : existing.definition;

  const now = new Date();
  const [row] = await db
    .update(printTemplate)
    .set({
      name,
      definitionJson: JSON.stringify(definition),
      updatedAt: now,
    })
    .where(
      and(
        eq(printTemplate.id, input.templateId),
        eq(printTemplate.organizationId, input.organizationId),
      ),
    )
    .returning();

  if (!row) {
    throw new TemplateNotFoundError();
  }

  return toPublic(row);
}

export async function deleteTemplate(input: {
  organizationId: string
  templateId: string
}): Promise<void> {
  const deleted = await db
    .delete(printTemplate)
    .where(
      and(
        eq(printTemplate.id, input.templateId),
        eq(printTemplate.organizationId, input.organizationId),
      ),
    )
    .returning({ id: printTemplate.id });

  if (deleted.length === 0) {
    throw new TemplateNotFoundError();
  }
}
