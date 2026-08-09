/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { requirePrinterAgentDeviceToken } from '../../../../../../lib/protocol-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Printer Agent heartbeat (auth seam for #4).
 * Requires a valid active device token; presence/online semantics land with later tickets.
 */
export async function POST(request: Request) {
  const authResult = await requirePrinterAgentDeviceToken(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  return Response.json({
    status: 'ok',
    printerAgentId: authResult.printerAgent.id,
    organizationId: authResult.printerAgent.organizationId,
  });
}
