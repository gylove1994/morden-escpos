/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { JobStatus, ReportStatus } from '../src/protocol/types';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { protocolFixturePath } from '../src/fixtures-path';
import {
  decodeDiscoveryReportResponse,
  decodeHeartbeatResponse,
  decodeJobPayload,
  decodeLeaseResponse,
  encodeDiscoveryReportRequest,
  encodeJobReportRequest,
} from '../src/protocol/codec';
import { isAllowedJobTransition } from '../src/protocol/transitions';

function readFixture<T>(name: string): T {
  return JSON.parse(readFileSync(protocolFixturePath(name), 'utf8')) as T;
}

describe('print Queue Agent Protocol contract (Node Printer Agent)', () => {
  it('decodes shared lease-response fixture including printerAgentId and TCP hints', () => {
    const fixture = readFixture<unknown>('lease.job.response.json');
    const job = decodeLeaseResponse(fixture);

    expect(job.printerAgentId).toBe('pa_fixture_001');
    expect(job.status).toBe('leased');
    expect(job.connectionHints).toEqual({
      transport: 'tcp',
      address: '10.0.0.42',
      port: 9100,
    });

    const bytes = decodeJobPayload(job);
    expect(bytes).toEqual(Buffer.from([0x1B, 0x40, 0x48, 0x69, 0x0A]));
    expect(bytes.byteLength).toBe(job.payloadByteLength);
  });

  it('encodes report bodies to match shared fixtures', () => {
    expect(encodeJobReportRequest('printing')).toEqual(
      readFixture('report.printing.request.json'),
    );
    expect(encodeJobReportRequest('succeeded')).toEqual(
      readFixture('report.succeeded.request.json'),
    );
    expect(
      encodeJobReportRequest('failed', 'TCP connection refused'),
    ).toEqual(readFixture('report.failed.request.json'));
  });

  it('requires errorMessage when encoding failed reports', () => {
    expect(() => encodeJobReportRequest('failed')).toThrow(/errorMessage/);
    expect(() => encodeJobReportRequest('failed', '   ')).toThrow(/errorMessage/);
  });

  it('decodes shared heartbeat fixture with printerAgentId', () => {
    const fixture = readFixture<unknown>('heartbeat.ok.response.json');
    const body = decodeHeartbeatResponse(fixture);
    expect(body.status).toBe('ok');
    expect(body.printerAgentId).toBe('pa_fixture_001');
    expect(body.organizationId).toBe('org_fixture_001');
  });

  it('encodes and decodes shared discovery report fixtures', () => {
    const request = readFixture<{
      endpoints: Array<{
        connectionHints: { transport: 'tcp', address: string, port: number }
        suggestedName?: string
      }>
    }>('discovery-report.request.json');
    expect(encodeDiscoveryReportRequest(request.endpoints)).toEqual(request);

    const response = readFixture<unknown>('discovery-report.response.json');
    const decoded = decodeDiscoveryReportResponse(response);
    expect(decoded.status).toBe('ok');
    expect(decoded.printerAgentId).toBe('printer_agent_fixture_001');
    expect(decoded.discoveries[0]?.endpointKey).toBe('tcp://192.168.1.50:9100');
  });

  it('enforces shared job state transition table from scenarios.json', () => {
    const scenarios = readFixture<{
      stateTransitions: Record<string, string[]>
    }>('scenarios.json');

    const allowedPairs: Array<{ from: JobStatus, to: ReportStatus }> = [];
    for (const [from, tos] of Object.entries(scenarios.stateTransitions)) {
      for (const to of tos) {
        if (to === 'printing' || to === 'succeeded' || to === 'failed') {
          allowedPairs.push({ from: from as JobStatus, to: to as ReportStatus });
        }
      }
    }

    for (const edge of allowedPairs) {
      expect(isAllowedJobTransition(edge.from, edge.to)).toBe(true);
    }

    // Illegal report transitions the client must reject.
    const illegal: Array<{ from: JobStatus, to: ReportStatus }> = [
      { from: 'leased', to: 'succeeded' },
      { from: 'leased', to: 'failed' },
      { from: 'printing', to: 'printing' },
      { from: 'succeeded', to: 'printing' },
      { from: 'failed', to: 'printing' },
      { from: 'queued', to: 'printing' },
    ];
    for (const edge of illegal) {
      expect(isAllowedJobTransition(edge.from, edge.to)).toBe(false);
    }
  });
});
