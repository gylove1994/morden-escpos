/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import { ConnectionHintsSchema } from '../../../../../../lib/connection-hints';
import { reportDiscoveries } from '../../../../../../lib/discoveries';
import { requirePrinterAgentDeviceToken } from '../../../../../../lib/protocol-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ReportBodySchema = z.object({
  endpoints: z.array(
    z.object({
      connectionHints: ConnectionHintsSchema,
      suggestedName: z.string().trim().min(1).max(120).optional().nullable(),
    }),
  ).max(100),
});

/**
 * Printer Agent discovery report.
 * Upserts discovered TCP/USB/Serial endpoints for later admin confirm/name.
 */
export async function POST(request: Request) {
  const authResult = await requirePrinterAgentDeviceToken(request);
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

  const parsed = ReportBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const discoveries = await reportDiscoveries({
    organizationId: authResult.printerAgent.organizationId,
    printerAgentId: authResult.printerAgent.id,
    endpoints: parsed.data.endpoints.map(endpoint => ({
      connectionHints: endpoint.connectionHints,
      suggestedName: endpoint.suggestedName ?? null,
    })),
  });

  return Response.json({
    status: 'ok',
    printerAgentId: authResult.printerAgent.id,
    discoveries,
  });
}
