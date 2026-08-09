/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { enqueueFromJsonBody } from '../../../../../lib/enqueue-body';
import { requireIntegratorApiKey } from '../../../../../lib/integrator-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Integrator REST enqueue. Requires Bearer integrator API key (`ik_…`).
 * Printer Agent device tokens and human sessions MUST NOT authenticate here.
 */
export async function POST(request: Request) {
  const authResult = await requireIntegratorApiKey(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  return enqueueFromJsonBody({
    organizationId: authResult.apiKey.organizationId,
    body,
  });
}
