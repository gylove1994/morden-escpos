/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import {
  canManageIntegratorAuth,
  getConsoleSession,
} from '../../../../../../lib/console-auth';
import { revokeWebhookSigningSecret } from '../../../../../../lib/webhook-secret';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ webhookSecretId: string }>
}

/**
 * Revoke a webhook signing secret. Shared-secret and signed auth stop working.
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
        message: 'owner or admin role required to revoke a webhook signing secret',
      },
      { status: 403 },
    );
  }

  const { webhookSecretId } = await context.params;
  if (!webhookSecretId) {
    return Response.json({ error: 'invalid_webhook_secret_id' }, { status: 400 });
  }

  const revoked = await revokeWebhookSigningSecret({
    organizationId: consoleSession.organization.id,
    webhookSecretId,
  });

  if (!revoked) {
    return Response.json(
      { error: 'not_found', message: 'Webhook signing secret not found' },
      { status: 404 },
    );
  }

  return Response.json({ webhookSecret: revoked });
}
