/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import {
  authenticateIntegratorApiKey,
  type IntegratorApiKeyPublic,
} from './integrator-api-key';

/**
 * Extract a Bearer integrator API key from the Authorization header.
 * Human session cookies and Printer Agent device tokens MUST NOT be accepted here.
 */
export function extractBearerIntegratorApiKey(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match?.[1]) {
    return null;
  }
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export type IntegratorAuthResult
  = | { ok: true, apiKey: IntegratorApiKeyPublic }
    | { ok: false, response: Response };

/**
 * Authenticate an integrator REST enqueue request via API key.
 * Rejects missing, wrong-kind (device token / webhook secret), invalid, and
 * revoked keys with HTTP 401.
 */
export async function requireIntegratorApiKey(
  request: Request,
): Promise<IntegratorAuthResult> {
  const token = extractBearerIntegratorApiKey(request);
  if (!token) {
    return {
      ok: false,
      response: Response.json(
        {
          error: 'unauthorized',
          message: 'Integrator API key required (Bearer)',
        },
        { status: 401 },
      ),
    };
  }

  const apiKey = await authenticateIntegratorApiKey(token);
  if (!apiKey) {
    return {
      ok: false,
      response: Response.json(
        {
          error: 'unauthorized',
          message: 'Invalid or revoked integrator API key',
        },
        { status: 401 },
      ),
    };
  }

  return { ok: true, apiKey };
}
