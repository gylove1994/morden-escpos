/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { describe, expect, it } from 'vitest';
import { parseTcpDiscoveryEndpoints } from '../src/discovery';

describe('parseTcpDiscoveryEndpoints', () => {
  it('parses comma-separated host:port entries', () => {
    expect(parseTcpDiscoveryEndpoints('192.168.1.50:9100,10.0.0.2:9101')).toEqual([
      {
        connectionHints: {
          transport: 'tcp',
          address: '192.168.1.50',
          port: 9100,
        },
      },
      {
        connectionHints: {
          transport: 'tcp',
          address: '10.0.0.2',
          port: 9101,
        },
      },
    ]);
  });

  it('returns an empty list for blank input', () => {
    expect(parseTcpDiscoveryEndpoints(undefined)).toEqual([]);
    expect(parseTcpDiscoveryEndpoints('')).toEqual([]);
    expect(parseTcpDiscoveryEndpoints('  ')).toEqual([]);
  });

  it('rejects malformed entries', () => {
    expect(() => parseTcpDiscoveryEndpoints('not-a-host')).toThrow(/host:port/);
    expect(() => parseTcpDiscoveryEndpoints('host:99999')).toThrow(/host:port/);
  });
});
