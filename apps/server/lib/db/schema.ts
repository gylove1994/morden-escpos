/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Scaffold marker table so Drizzle migrations are wired end-to-end.
 * Domain tables (organizations, Printer Agents, jobs, …) land in later tickets.
 */
export const scaffoldMarker = pgTable('scaffold_marker', {
  id: serial('id').primaryKey(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
