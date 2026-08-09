/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Scaffold marker table so Drizzle migrations are wired end-to-end.
 */
export const scaffoldMarker = pgTable('scaffold_marker', {
  id: serial('id').primaryKey(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Better Auth core + organization plugin tables.
 * Human session cookies live here — Printer Agent device tokens MUST stay separate (#4).
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull(),
  metadata: text('metadata'),
});

export const member = pgTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').default('member').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

/**
 * On-site Printer Agent registration.
 * Device tokens are stored hashed (`deviceTokenHash`); plaintext is shown once on create/rotate.
 */
export const printerAgent = pgTable('printer_agent', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** `active` | `revoked` — revoked tokens MUST NOT authenticate. */
  status: text('status').notNull().default('active'),
  /** SHA-256 hex of the device token. Null when revoked. */
  deviceTokenHash: text('device_token_hash').unique(),
  /** Non-secret prefix for console display (e.g. `pa_abcd…`). */
  deviceTokenPrefix: text('device_token_prefix'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastAuthenticatedAt: timestamp('last_authenticated_at', { withTimezone: true }),
});

/**
 * Confirmed Printer bound under a Printer Agent.
 * Connection hints travel with leased job payloads so the Printer Agent
 * knows which local device to open (TCP / USB / Serial).
 */
export const printer = pgTable('printer', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  printerAgentId: text('printer_agent_id')
    .notNull()
    .references(() => printerAgent.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** `active` | `disabled` — disabled printers MUST NOT accept new enqueue. */
  status: text('status').notNull().default('active'),
  /**
   * JSON connection hints (transport + endpoint fields).
   * Stored as text JSON for MVP; validated at the API boundary.
   */
  connectionHintsJson: text('connection_hints_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Raw print job targeting a single Printer.
 * State machine: queued → leased → printing → succeeded | failed.
 * Expired leases return to queued.
 */
export const printJob = pgTable(
  'print_job',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    printerId: text('printer_id')
      .notNull()
      .references(() => printer.id, { onDelete: 'restrict' }),
    /** Denormalized for Printer Agent lease queries. */
    printerAgentId: text('printer_agent_id')
      .notNull()
      .references(() => printerAgent.id, { onDelete: 'cascade' }),
    /** `queued` | `leased` | `printing` | `succeeded` | `failed` */
    status: text('status').notNull().default('queued'),
    /** Raw ESC/POS bytes encoded as standard base64. */
    payloadBase64: text('payload_base64').notNull(),
    payloadByteLength: integer('payload_byte_length').notNull(),
    /** Optional integrator idempotency key; unique per Organization when set. */
    idempotencyKey: text('idempotency_key'),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    leasedAt: timestamp('leased_at', { withTimezone: true }),
    printingAt: timestamp('printing_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  table => [
    uniqueIndex('print_job_org_idempotency_uidx').on(
      table.organizationId,
      table.idempotencyKey,
    ),
  ],
);

/**
 * Organization-scoped JSON print template (PrintJobJSON definition).
 * Server renders `templateId + inputs` to raw ESC/POS at enqueue time.
 */
export const printTemplate = pgTable('print_template', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** Stored PrintJobJSON definition (commands + optional inputs schema). */
  definitionJson: text('definition_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  printerAgents: many(printerAgent),
  printers: many(printer),
  printJobs: many(printJob),
  printTemplates: many(printTemplate),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const printerAgentRelations = relations(printerAgent, ({ one, many }) => ({
  organization: one(organization, {
    fields: [printerAgent.organizationId],
    references: [organization.id],
  }),
  printers: many(printer),
  printJobs: many(printJob),
}));

export type PrinterAgentRow = typeof printerAgent.$inferSelect;
export type PrinterAgentStatus = 'active' | 'revoked';

export const printerRelations = relations(printer, ({ one, many }) => ({
  organization: one(organization, {
    fields: [printer.organizationId],
    references: [organization.id],
  }),
  printerAgent: one(printerAgent, {
    fields: [printer.printerAgentId],
    references: [printerAgent.id],
  }),
  printJobs: many(printJob),
}));

export type PrinterRow = typeof printer.$inferSelect;
export type PrinterStatus = 'active' | 'disabled';

export const printJobRelations = relations(printJob, ({ one }) => ({
  organization: one(organization, {
    fields: [printJob.organizationId],
    references: [organization.id],
  }),
  printer: one(printer, {
    fields: [printJob.printerId],
    references: [printer.id],
  }),
  printerAgent: one(printerAgent, {
    fields: [printJob.printerAgentId],
    references: [printerAgent.id],
  }),
}));

export type PrintJobRow = typeof printJob.$inferSelect;
export type PrintJobStatus = 'queued' | 'leased' | 'printing' | 'succeeded' | 'failed';

export const printTemplateRelations = relations(printTemplate, ({ one }) => ({
  organization: one(organization, {
    fields: [printTemplate.organizationId],
    references: [organization.id],
  }),
}));

export type PrintTemplateRow = typeof printTemplate.$inferSelect;
