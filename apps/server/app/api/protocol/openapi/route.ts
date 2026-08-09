/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import {
  PRINT_QUEUE_AGENT_PROTOCOL_OPENAPI_RELATIVE_PATH,
  readPrintQueueAgentProtocolOpenApi,
} from '../../../../lib/protocol';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Serves the checked-in Print Queue Agent Protocol OpenAPI skeleton so the
 * server references and exposes the shared contract.
 */
export async function GET() {
  const body = await readPrintQueueAgentProtocolOpenApi();

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/yaml; charset=utf-8',
      'x-morden-protocol-contract': PRINT_QUEUE_AGENT_PROTOCOL_OPENAPI_RELATIVE_PATH,
    },
  });
}
