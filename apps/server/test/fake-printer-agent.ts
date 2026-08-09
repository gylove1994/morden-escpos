/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */

/**
 * In-process fake Printer Agent that drives the Print Queue Agent Protocol
 * at the HTTP seam (lease + report). Used by server integration tests.
 */
export interface FakeLeasedJob {
  id: string
  printerId: string
  printerAgentId: string
  status: 'leased'
  payloadBase64: string
  payloadByteLength: number
  connectionHints: unknown
  leaseExpiresAt: string
  createdAt: string
}

export interface FakeJobPublic {
  id: string
  status: string
  errorMessage: string | null
  payloadBase64: string
  payloadByteLength: number
}

export class FakePrinterAgent {
  constructor(
    private readonly baseUrl: string,
    private readonly deviceToken: string,
  ) {}

  private headers(json = false): Headers {
    const headers = new Headers({
      Authorization: `Bearer ${this.deviceToken}`,
    });
    if (json) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  async heartbeat(): Promise<Response> {
    return fetch(`${this.baseUrl}/api/protocol/v1/printer-agents/heartbeat`, {
      method: 'POST',
      headers: this.headers(true),
    });
  }

  /**
   * Short-poll lease. Returns null on 204 (no work).
   */
  async lease(): Promise<{ response: Response, job: FakeLeasedJob | null }> {
    const response = await fetch(`${this.baseUrl}/api/protocol/v1/jobs/lease`, {
      method: 'POST',
      headers: this.headers(true),
    });

    if (response.status === 204) {
      return { response, job: null };
    }

    if (!response.ok) {
      return { response, job: null };
    }

    const body = await response.json() as { job: FakeLeasedJob };
    return { response, job: body.job };
  }

  async report(
    jobId: string,
    status: 'printing' | 'succeeded' | 'failed',
    errorMessage?: string,
  ): Promise<{ response: Response, job: FakeJobPublic | null }> {
    const response = await fetch(
      `${this.baseUrl}/api/protocol/v1/jobs/${jobId}/report`,
      {
        method: 'POST',
        headers: this.headers(true),
        body: JSON.stringify({
          status,
          ...(errorMessage ? { errorMessage } : {}),
        }),
      },
    );

    if (!response.ok) {
      return { response, job: null };
    }

    const body = await response.json() as { job: FakeJobPublic };
    return { response, job: body.job };
  }

  /**
   * Lease one job and walk printing → succeeded (or failed).
   */
  async drainOne(outcome: 'succeeded' | 'failed' = 'succeeded', errorMessage = 'print failed'): Promise<{
    leased: FakeLeasedJob | null
    printing: FakeJobPublic | null
    final: FakeJobPublic | null
    statuses: number[]
  }> {
    const statuses: number[] = [];
    const leasedResult = await this.lease();
    statuses.push(leasedResult.response.status);
    if (!leasedResult.job) {
      return { leased: null, printing: null, final: null, statuses };
    }

    const printingResult = await this.report(leasedResult.job.id, 'printing');
    statuses.push(printingResult.response.status);

    const finalResult = outcome === 'succeeded'
      ? await this.report(leasedResult.job.id, 'succeeded')
      : await this.report(leasedResult.job.id, 'failed', errorMessage);
    statuses.push(finalResult.response.status);

    return {
      leased: leasedResult.job,
      printing: printingResult.job,
      final: finalResult.job,
      statuses,
    };
  }
}
