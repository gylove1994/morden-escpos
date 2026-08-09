/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';

/** Connection hints carried on leased jobs (TCP only in this slice). */
export const TcpConnectionHintsSchema = z.object({
  transport: z.literal('tcp'),
  address: z.string().trim().min(1),
  port: z.number().int().min(1).max(65535),
});

export const ConnectionHintsSchema = z.discriminatedUnion('transport', [
  TcpConnectionHintsSchema,
  z.object({
    transport: z.literal('usb'),
    path: z.string().trim().min(1),
  }),
  z.object({
    transport: z.literal('serial'),
    path: z.string().trim().min(1),
    baudRate: z.number().int().min(300).max(1_000_000).optional(),
  }),
]);

export type ConnectionHints = z.infer<typeof ConnectionHintsSchema>;
export type TcpConnectionHints = z.infer<typeof TcpConnectionHintsSchema>;

export const JobStatusSchema = z.enum([
  'queued',
  'leased',
  'printing',
  'succeeded',
  'failed',
]);

export type JobStatus = z.infer<typeof JobStatusSchema>;

export const ReportStatusSchema = z.enum(['printing', 'succeeded', 'failed']);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

export const LeasedJobSchema = z.object({
  id: z.string().min(1),
  printerId: z.string().min(1),
  printerAgentId: z.string().min(1),
  status: z.literal('leased'),
  payloadBase64: z.string().min(1),
  payloadByteLength: z.number().int().min(1),
  connectionHints: ConnectionHintsSchema,
  leaseExpiresAt: z.string().min(1),
  createdAt: z.string().min(1),
});

export type LeasedJob = z.infer<typeof LeasedJobSchema>;

export const JobLeaseResponseSchema = z.object({
  job: LeasedJobSchema,
});

export const JobPublicSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1).optional(),
  printerId: z.string().min(1).optional(),
  printerAgentId: z.string().min(1).optional(),
  status: JobStatusSchema,
  payloadBase64: z.string().optional(),
  payloadByteLength: z.number().int().optional(),
  errorMessage: z.string().nullable().optional(),
  leaseExpiresAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type JobPublic = z.infer<typeof JobPublicSchema>;

export const JobReportResponseSchema = z.object({
  job: JobPublicSchema,
});

export const HeartbeatResponseSchema = z.object({
  status: z.literal('ok'),
  printerAgentId: z.string().min(1),
  organizationId: z.string().min(1),
});

export type HeartbeatResponse = z.infer<typeof HeartbeatResponseSchema>;

export const ProtocolErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export type ProtocolError = z.infer<typeof ProtocolErrorSchema>;
