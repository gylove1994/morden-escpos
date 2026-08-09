/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { protocolFixturePath } from '../src/fixtures-path';
import {
  decodeHeartbeatResponse,
  decodeJobPayload,
  decodeLeaseResponse,
  encodeJobReportRequest,
} from '../src/protocol/codec';
import { isAllowedJobTransition } from '../src/protocol/transitions';
import type { JobStatus, ReportStatus } from '../src/protocol/types';

function readFixture<T>(name: string): T {
  return JSON.parse(readFileSync(protocolFixturePath(name), 'utf8')) as T;
}

describe('Print Queue Agent Protocol contract (Node Printer Agent)', () => {
  it('decodes shared lease-response fixture including printerAgentId and TCP hints', () => {
    const fixture = readFixture<unknown>('lease-response.example.json');
    const job = decodeLeaseResponse(fixture);

    expect(job.printerAgentId).toBe('printer_agent_fixture_001');
    expect(job.status).toBe('leased');
    expect(job.connectionHints).toEqual({
      transport: 'tcp',
      address: '192.168.1.50',
      port: 9100,
    });

    const bytes = decodeJobPayload(job);
    expect(bytes).toEqual(Buffer.from([0x1B, 0x40, 0x48, 0x49, 0x0A]));
    expect(bytes.byteLength).toBe(job.payloadByteLength);
  });

  it('encodes report bodies to match shared fixtures', () => {
    expect(encodeJobReportRequest('printing')).toEqual(
      readFixture('report-printing.request.json'),
    );
    expect(encodeJobReportRequest('succeeded')).toEqual(
      readFixture('report-succeeded.request.json'),
    );
    expect(
      encodeJobReportRequest('failed', 'TCP write failed: connection refused'),
    ).toEqual(readFixture('report-failed.request.json'));
  });

  it('requires errorMessage when encoding failed reports', () => {
    expect(() => encodeJobReportRequest('failed')).toThrow(/errorMessage/);
    expect(() => encodeJobReportRequest('failed', '   ')).toThrow(/errorMessage/);
  });

  it('decodes shared heartbeat fixture with printerAgentId', () => {
    const fixture = readFixture<unknown>('heartbeat-response.example.json');
    const body = decodeHeartbeatResponse(fixture);
    expect(body.status).toBe('ok');
    expect(body.printerAgentId).toBe('printer_agent_fixture_001');
    expect(body.organizationId).toBe('org_fixture_001');
  });

  it('enforces shared job state transition table', () => {
    const table = readFixture<{
      allowed: Array<{ from: JobStatus, to: ReportStatus }>
      illegal: Array<{ from: JobStatus, to: ReportStatus }>
    }>('job-state-transitions.json');

    for (const edge of table.allowed) {
      expect(isAllowedJobTransition(edge.from, edge.to)).toBe(true);
    }
    for (const edge of table.illegal) {
      expect(isAllowedJobTransition(edge.from, edge.to)).toBe(false);
    }
  });
});
