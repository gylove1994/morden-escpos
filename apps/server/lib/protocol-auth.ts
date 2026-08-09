/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { PrinterAgentPublic } from './printer-agents';
import { authenticatePrinterAgentDeviceToken } from './printer-agents';

/**
 * Extract a Bearer device token from the Authorization header.
 * Human session cookies MUST NOT be accepted here.
 */
export function extractBearerDeviceToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) {
    return null;
  }
  // Use \S+ so the pattern cannot backtrack against whitespace (eslint regexp/no-super-linear-backtracking).
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match?.[1]) {
    return null;
  }
  return match[1];
}

export type ProtocolAuthResult
  = | { ok: true, printerAgent: PrinterAgentPublic }
    | { ok: false, response: Response };

/**
 * Authenticate a Print Queue Agent Protocol request via device token.
 * Rejects missing, invalid, and revoked tokens with HTTP 401.
 */
export async function requirePrinterAgentDeviceToken(
  request: Request,
): Promise<ProtocolAuthResult> {
  const token = extractBearerDeviceToken(request);
  if (!token) {
    return {
      ok: false,
      response: Response.json(
        {
          error: 'unauthorized',
          message: 'Printer Agent device token required (Bearer)',
        },
        { status: 401 },
      ),
    };
  }

  const printerAgent = await authenticatePrinterAgentDeviceToken(token);
  if (!printerAgent) {
    return {
      ok: false,
      response: Response.json(
        {
          error: 'unauthorized',
          message: 'Invalid or revoked Printer Agent device token',
        },
        { status: 401 },
      ),
    };
  }

  return { ok: true, printerAgent };
}
