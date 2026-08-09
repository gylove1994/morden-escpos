/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';

/**
 * Local device connection hints carried on Printer records and leased jobs.
 * Printer Agents use these to open TCP / USB / Serial endpoints.
 */
export const ConnectionHintsSchema = z.discriminatedUnion('transport', [
  z.object({
    transport: z.literal('tcp'),
    address: z.string().trim().min(1).max(255),
    port: z.number().int().min(1).max(65535),
  }),
  z.object({
    transport: z.literal('usb'),
    path: z.string().trim().min(1).max(512),
  }),
  z.object({
    transport: z.literal('serial'),
    path: z.string().trim().min(1).max(512),
    baudRate: z.number().int().min(300).max(1_000_000).optional(),
  }),
]);

export type ConnectionHints = z.infer<typeof ConnectionHintsSchema>;

export function parseConnectionHintsJson(raw: string): ConnectionHints {
  const parsedJson: unknown = JSON.parse(raw);
  return ConnectionHintsSchema.parse(parsedJson);
}

export function stringifyConnectionHints(hints: ConnectionHints): string {
  return JSON.stringify(hints);
}
