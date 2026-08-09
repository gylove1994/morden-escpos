/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';

/** Connection hints carried on leased jobs (TCP / USB / Serial). */
export const TcpConnectionHintsSchema = z.object({
  transport: z.literal('tcp'),
  address: z.string().trim().min(1),
  port: z.number().int().min(1).max(65535),
});

export const UsbConnectionHintsSchema = z.object({
  transport: z.literal('usb'),
  path: z.string().trim().min(1),
});

export const SerialConnectionHintsSchema = z.object({
  transport: z.literal('serial'),
  path: z.string().trim().min(1),
  baudRate: z.number().int().min(300).max(1_000_000).optional(),
});

export const ConnectionHintsSchema = z.discriminatedUnion('transport', [
  TcpConnectionHintsSchema,
  UsbConnectionHintsSchema,
  SerialConnectionHintsSchema,
]);

export type ConnectionHints = z.infer<typeof ConnectionHintsSchema>;
export type TcpConnectionHints = z.infer<typeof TcpConnectionHintsSchema>;
export type UsbConnectionHints = z.infer<typeof UsbConnectionHintsSchema>;
export type SerialConnectionHints = z.infer<typeof SerialConnectionHintsSchema>;

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

export const DiscoveryEndpointSchema = z.object({
  connectionHints: ConnectionHintsSchema,
  suggestedName: z.string().trim().min(1).max(120).optional().nullable(),
});

export type DiscoveryEndpoint = z.infer<typeof DiscoveryEndpointSchema>;

export const DiscoveryReportRequestSchema = z.object({
  endpoints: z.array(DiscoveryEndpointSchema).max(100),
});

export type DiscoveryReportRequest = z.infer<typeof DiscoveryReportRequestSchema>;

export const PrinterDiscoverySchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  printerAgentId: z.string().min(1),
  endpointKey: z.string().min(1),
  connectionHints: ConnectionHintsSchema,
  suggestedName: z.string().nullable().optional(),
  firstSeenAt: z.string().min(1),
  lastSeenAt: z.string().min(1),
  confirmedPrinterId: z.string().nullable().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type PrinterDiscovery = z.infer<typeof PrinterDiscoverySchema>;

export const DiscoveryReportResponseSchema = z.object({
  status: z.literal('ok'),
  printerAgentId: z.string().min(1),
  discoveries: z.array(PrinterDiscoverySchema),
});

export type DiscoveryReportResponse = z.infer<typeof DiscoveryReportResponseSchema>;

export const ProtocolErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export type ProtocolError = z.infer<typeof ProtocolErrorSchema>;
