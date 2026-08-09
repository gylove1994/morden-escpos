/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { HeartbeatResponse, JobPublic, LeasedJob, ReportStatus } from './types';
import {
  decodeHeartbeatResponse,
  decodeLeaseResponse,
  decodeReportResponse,
  encodeJobReportRequest,
} from './codec';
import { ProtocolErrorSchema } from './types';

export class ProtocolClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'ProtocolClientError';
  }
}

export interface ProtocolClientOptions {
  serverUrl: string
  deviceToken: string
  fetchImpl?: typeof fetch
}

/**
 * HTTP client for the Print Queue Agent Protocol.
 * Authenticates with a Printer Agent device token (Bearer).
 */
export class ProtocolClient {
  private readonly baseUrl: string;
  private readonly deviceToken: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ProtocolClientOptions) {
    this.baseUrl = options.serverUrl.replace(/\/+$/, '');
    this.deviceToken = options.deviceToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private headers(json = false): Headers {
    const headers = new Headers({
      Authorization: `Bearer ${this.deviceToken}`,
    });
    if (json) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  private protocolUrl(path: string): string {
    return `${this.baseUrl}/api/protocol/v1${path}`;
  }

  private async readError(response: Response): Promise<never> {
    let body: unknown = null;
    try {
      body = await response.json();
    }
    catch {
      body = null;
    }
    const parsed = ProtocolErrorSchema.safeParse(body);
    const message = parsed.success
      ? `${parsed.data.error}: ${parsed.data.message}`
      : `Protocol request failed with HTTP ${response.status}`;
    throw new ProtocolClientError(message, response.status, body);
  }

  async heartbeat(): Promise<HeartbeatResponse> {
    const response = await this.fetchImpl(this.protocolUrl('/printer-agents/heartbeat'), {
      method: 'POST',
      headers: this.headers(true),
    });
    if (!response.ok) {
      await this.readError(response);
    }
    return decodeHeartbeatResponse(await response.json());
  }

  /**
   * Short-poll lease. Returns null when the server responds 204 (no work).
   */
  async lease(): Promise<LeasedJob | null> {
    const response = await this.fetchImpl(this.protocolUrl('/jobs/lease'), {
      method: 'POST',
      headers: this.headers(true),
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      await this.readError(response);
    }

    return decodeLeaseResponse(await response.json());
  }

  async report(
    jobId: string,
    status: ReportStatus,
    errorMessage?: string,
  ): Promise<JobPublic> {
    const body = encodeJobReportRequest(status, errorMessage);
    const response = await this.fetchImpl(this.protocolUrl(`/jobs/${encodeURIComponent(jobId)}/report`), {
      method: 'POST',
      headers: this.headers(true),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await this.readError(response);
    }

    return decodeReportResponse(await response.json());
  }
}
