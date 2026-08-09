/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { HeartbeatResponse, JobPublic, LeasedJob, ReportStatus } from './types';
import { Buffer } from 'node:buffer';
import {
  HeartbeatResponseSchema,
  JobLeaseResponseSchema,
  JobReportResponseSchema,
  LeasedJobSchema,
} from './types';

export interface JobReportRequestBody {
  status: ReportStatus
  errorMessage?: string
}

/**
 * Encode a job report request body per the Print Queue Agent Protocol.
 * `failed` MUST include a non-empty errorMessage.
 */
export function encodeJobReportRequest(
  status: ReportStatus,
  errorMessage?: string,
): JobReportRequestBody {
  if (status === 'failed') {
    const message = errorMessage?.trim();
    if (!message) {
      throw new Error('errorMessage is required when status is failed');
    }
    return { status, errorMessage: message };
  }
  return { status };
}

export function decodeLeaseResponse(body: unknown): LeasedJob {
  return JobLeaseResponseSchema.parse(body).job;
}

export function decodeLeasedJob(body: unknown): LeasedJob {
  return LeasedJobSchema.parse(body);
}

export function decodeReportResponse(body: unknown): JobPublic {
  return JobReportResponseSchema.parse(body).job;
}

export function decodeHeartbeatResponse(body: unknown): HeartbeatResponse {
  return HeartbeatResponseSchema.parse(body);
}

/**
 * Decode leased payloadBase64 and verify byte length matches the lease metadata.
 */
export function decodeJobPayload(job: LeasedJob): Buffer {
  const bytes = Buffer.from(job.payloadBase64, 'base64');
  if (bytes.byteLength !== job.payloadByteLength) {
    throw new Error(
      `payloadByteLength mismatch: expected ${job.payloadByteLength}, got ${bytes.byteLength}`,
    );
  }
  return bytes;
}
