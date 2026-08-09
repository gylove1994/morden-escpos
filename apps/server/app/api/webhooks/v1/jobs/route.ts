/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { enqueueFromJsonBody } from '../../../../../lib/enqueue-body';
import { requireWebhookAuth } from '../../../../../lib/webhook-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Integrator webhook enqueue.
 * Auth via shared secret (`X-Webhook-Secret`) or HMAC signature headers.
 * Device tokens and integrator API keys MUST NOT authenticate here.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const authResult = await requireWebhookAuth(request, rawBody);
  if (!authResult.ok) {
    return authResult.response;
  }

  let body: unknown;
  try {
    body = rawBody.length === 0 ? null : JSON.parse(rawBody);
  }
  catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  return enqueueFromJsonBody({
    organizationId: authResult.webhookSecret.organizationId,
    body,
  });
}
