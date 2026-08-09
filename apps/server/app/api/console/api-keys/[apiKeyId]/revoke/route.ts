/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import {
  canManageIntegratorAuth,
  getConsoleSession,
} from '../../../../../../lib/console-auth';
import { revokeIntegratorApiKey } from '../../../../../../lib/integrator-api-key';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ apiKeyId: string }>
};

/**
 * Revoke an integrator API key. The old key stops authenticating.
 * owner/admin MAY; member MUST NOT.
 */
export async function POST(request: Request, context: RouteContext) {
  const consoleSession = await getConsoleSession(request.headers);
  if (!consoleSession) {
    return Response.json(
      { error: 'unauthorized', message: 'Sign in required' },
      { status: 401 },
    );
  }

  if (!consoleSession.organization) {
    return Response.json(
      { error: 'no_organization', message: 'Active Organization required' },
      { status: 400 },
    );
  }

  if (!canManageIntegratorAuth(consoleSession.role)) {
    return Response.json(
      {
        error: 'forbidden',
        message: 'owner or admin role required to revoke an integrator API key',
      },
      { status: 403 },
    );
  }

  const { apiKeyId } = await context.params;
  if (!apiKeyId) {
    return Response.json({ error: 'invalid_api_key_id' }, { status: 400 });
  }

  const revoked = await revokeIntegratorApiKey({
    organizationId: consoleSession.organization.id,
    apiKeyId,
  });

  if (!revoked) {
    return Response.json(
      { error: 'not_found', message: 'Integrator API key not found' },
      { status: 404 },
    );
  }

  return Response.json({ apiKey: revoked });
}
