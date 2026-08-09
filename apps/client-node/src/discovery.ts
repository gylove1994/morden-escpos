/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { DiscoveryEndpoint, TcpConnectionHints } from './protocol/types';

/**
 * Parse `host:port` / `host` entries into TCP discovery endpoints.
 * USB/Serial transport discovery is out of scope for this slice (#13).
 */
export function parseTcpDiscoveryEndpoints(
  raw: string | undefined,
): DiscoveryEndpoint[] {
  if (!raw?.trim()) {
    return [];
  }

  const endpoints: DiscoveryEndpoint[] = [];
  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const separator = trimmed.lastIndexOf(':');
    if (separator <= 0 || separator === trimmed.length - 1) {
      throw new Error(
        `Invalid DISCOVER_TCP_ENDPOINTS entry "${trimmed}" (expected host:port)`,
      );
    }

    const address = trimmed.slice(0, separator).trim();
    const port = Number(trimmed.slice(separator + 1));
    if (!address || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(
        `Invalid DISCOVER_TCP_ENDPOINTS entry "${trimmed}" (expected host:port)`,
      );
    }

    const connectionHints: TcpConnectionHints = {
      transport: 'tcp',
      address,
      port,
    };
    endpoints.push({ connectionHints });
  }

  return endpoints;
}
