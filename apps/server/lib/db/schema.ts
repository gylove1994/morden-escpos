import type { AnyPgColumn } from 'drizzle-orm/pg-core';
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

/**
 * Organization (tenant) row.
 *
 * `status` is a cloud platform tenant-ops field (`active` | `suspended` |
 * `banned`). Self-hosted builds omit the platform APIs that mutate it; the
 * column remains so a shared schema/migration applies to both editions.
 */
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull(),
  metadata: text('metadata'),
  /** active | suspended | banned — enforced on console/API for cloud abuse stop. */
  status: text('status').default('active').notNull(),
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
 * Cloud billing state for an Organization (Stripe customer + plan entitlements).
 * Self-hosted edition does not use this table for enforcement paths.
 */
export const organizationBilling = pgTable('organization_billing', {
  organizationId: text('organization_id')
    .primaryKey()
    .references(() => organization.id, { onDelete: 'cascade' }),
  /** none | personal | business | reseller */
  plan: text('plan').default('none').notNull(),
  /** none | active | trialing | past_due | canceled | unpaid | incomplete … */
  status: text('status').default('none').notNull(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  monthlyJobCount: integer('monthly_job_count').default(0).notNull(),
  /** UTC calendar month key `YYYY-MM` for monthly job quota window. */
  monthlyJobPeriodKey: text('monthly_job_period_key').default('').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
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
 * Integrator API key for REST enqueue (`Authorization: Bearer ik_…`).
 * Stored hashed; plaintext shown once on create. MUST stay distinct from
 * Printer Agent device tokens (`pa_…`) and human sessions.
 */
export const integratorApiKey = pgTable('integrator_api_key', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** `active` | `revoked` — revoked keys MUST NOT authenticate. */
  status: text('status').notNull().default('active'),
  /** SHA-256 hex of the API key. Null when revoked. */
  keyHash: text('key_hash').unique(),
  /** Non-secret prefix for console display (e.g. `ik_abcd…`). */
  keyPrefix: text('key_prefix'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastAuthenticatedAt: timestamp('last_authenticated_at', { withTimezone: true }),
});

/**
 * Webhook signing secret for integrator webhook enqueue.
 * Auth: shared-secret header (`X-Webhook-Secret`) or HMAC-signed request
 * (`X-Webhook-Id` + `X-Webhook-Timestamp` + `X-Webhook-Signature`).
 * Secret is stored hashed (shared-secret lookup) and encrypted (HMAC verify).
 * MUST stay distinct from device tokens and integrator API keys.
 */
export const webhookSigningSecret = pgTable('webhook_signing_secret', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** `active` | `revoked` — revoked secrets MUST NOT authenticate. */
  status: text('status').notNull().default('active'),
  /** SHA-256 hex of the webhook secret. Null when revoked. */
  secretHash: text('secret_hash').unique(),
  /**
   * AES-256-GCM ciphertext (base64) of the plaintext secret, keyed from
   * AUTH_SECRET — required to verify HMAC signatures without accepting the
   * secret in the request.
   */
  secretEncrypted: text('secret_encrypted'),
  /** Non-secret prefix for console display (e.g. `whsec_abcd…`). */
  secretPrefix: text('secret_prefix'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastAuthenticatedAt: timestamp('last_authenticated_at', { withTimezone: true }),
});

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

/**
 * Fan-out target under exactly one Printer Agent.
 * Enqueue expands into N child jobs sharing a parent id.
 */
export const printerGroup = pgTable('printer_group', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  printerAgentId: text('printer_agent_id')
    .notNull()
    .references(() => printerAgent.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const printerGroupMember = pgTable(
  'printer_group_member',
  {
    id: text('id').primaryKey(),
    printerGroupId: text('printer_group_id')
      .notNull()
      .references(() => printerGroup.id, { onDelete: 'cascade' }),
    printerId: text('printer_id')
      .notNull()
      .references(() => printer.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex('printer_group_member_uidx').on(
      table.printerGroupId,
      table.printerId,
    ),
  ],
);

/**
 * Raw print job targeting a single Printer, or a parent/child fan-out pair.
 */
export const printJob = pgTable(
  'print_job',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    printerId: text('printer_id').references(() => printer.id, { onDelete: 'restrict' }),
    printerAgentId: text('printer_agent_id')
      .notNull()
      .references(() => printerAgent.id, { onDelete: 'cascade' }),
    printerGroupId: text('printer_group_id').references(() => printerGroup.id, {
      onDelete: 'set null',
    }),
    parentJobId: text('parent_job_id').references((): AnyPgColumn => printJob.id, {
      onDelete: 'cascade',
    }),
    kind: text('kind').notNull().default('single'),
    status: text('status').notNull().default('queued'),
    /**
     * Why the job was enqueued (`standard` vs embedded-editor `template_confirmation`).
     */
    purpose: text('purpose').notNull().default('standard'),
    /** Optional template used for server-side render (confirmation / template enqueue). */
    templateId: text('template_id').references(() => printTemplate.id, {
      onDelete: 'set null',
    }),
    payloadBase64: text('payload_base64').notNull(),
    payloadByteLength: integer('payload_byte_length').notNull(),
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

export const printerGroupRelations = relations(printerGroup, ({ one, many }) => ({
  organization: one(organization, {
    fields: [printerGroup.organizationId],
    references: [organization.id],
  }),
  printerAgent: one(printerAgent, {
    fields: [printerGroup.printerAgentId],
    references: [printerAgent.id],
  }),
  members: many(printerGroupMember),
  printJobs: many(printJob),
}));

export const printerGroupMemberRelations = relations(printerGroupMember, ({ one }) => ({
  printerGroup: one(printerGroup, {
    fields: [printerGroupMember.printerGroupId],
    references: [printerGroup.id],
  }),
  printer: one(printer, {
    fields: [printerGroupMember.printerId],
    references: [printer.id],
  }),
}));

export type PrinterGroupRow = typeof printerGroup.$inferSelect;
export type PrinterGroupMemberRow = typeof printerGroupMember.$inferSelect;

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
  printerGroups: many(printerGroup),
  integratorApiKeys: many(integratorApiKey),
  webhookSigningSecrets: many(webhookSigningSecret),
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
  printerGroups: many(printerGroup),
  printJobs: many(printJob),
}));

export const organizationBillingRelations = relations(
  organizationBilling,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationBilling.organizationId],
      references: [organization.id],
    }),
  }),
);

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
  groupMemberships: many(printerGroupMember),
  printJobs: many(printJob),
}));

export type PrinterRow = typeof printer.$inferSelect;
export type PrinterStatus = 'active' | 'disabled';

export const printJobRelations = relations(printJob, ({ one, many }) => ({
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
  printerGroup: one(printerGroup, {
    fields: [printJob.printerGroupId],
    references: [printerGroup.id],
  }),
  template: one(printTemplate, {
    fields: [printJob.templateId],
    references: [printTemplate.id],
  }),
  parentJob: one(printJob, {
    fields: [printJob.parentJobId],
    references: [printJob.id],
    relationName: 'print_job_parent_child',
  }),
  childJobs: many(printJob, {
    relationName: 'print_job_parent_child',
  }),
}));

export type PrintJobRow = typeof printJob.$inferSelect;
export type PrintJobKind = 'single' | 'parent' | 'child';
export type PrintJobPurpose = 'standard' | 'template_confirmation';
export type PrintJobStatus
  = | 'queued'
    | 'leased'
    | 'printing'
    | 'succeeded'
    | 'failed'
    | 'partial_failed';

export const integratorApiKeyRelations = relations(integratorApiKey, ({ one }) => ({
  organization: one(organization, {
    fields: [integratorApiKey.organizationId],
    references: [organization.id],
  }),
}));

export const printTemplateRelations = relations(printTemplate, ({ one }) => ({
  organization: one(organization, {
    fields: [printTemplate.organizationId],
    references: [organization.id],
  }),
}));

export type IntegratorApiKeyRow = typeof integratorApiKey.$inferSelect;
export type IntegratorApiKeyStatus = 'active' | 'revoked';

export const webhookSigningSecretRelations = relations(webhookSigningSecret, ({ one }) => ({
  organization: one(organization, {
    fields: [webhookSigningSecret.organizationId],
    references: [organization.id],
  }),
}));

export type WebhookSigningSecretRow = typeof webhookSigningSecret.$inferSelect;
export type WebhookSigningSecretStatus = 'active' | 'revoked';

export type PrintTemplateRow = typeof printTemplate.$inferSelect;
