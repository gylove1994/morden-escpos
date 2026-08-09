/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { leaseNextJob } from '../../../../../../lib/jobs';
import { requirePrinterAgentDeviceToken } from '../../../../../../lib/protocol-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Short-poll lease for the next printable job.
 * Authenticated Printer Agents exclusively lease one queued job (or receive 204).
 */
export async function POST(request: Request) {
  const authResult = await requirePrinterAgentDeviceToken(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const job = await leaseNextJob({
    printerAgentId: authResult.printerAgent.id,
    organizationId: authResult.printerAgent.organizationId,
  });

  if (!job) {
    return new Response(null, { status: 204 });
  }

  return Response.json({ job }, { status: 200 });
}
