/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { checkDatabaseConnectivity } from '../../../lib/db';
import { EDITION } from '../../../lib/edition';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await checkDatabaseConnectivity();
  }
  catch {
    return Response.json(
      {
        status: 'error',
        edition: EDITION,
        database: 'down',
      },
      { status: 503 },
    );
  }

  return Response.json({
    status: 'ok',
    edition: EDITION,
    database: 'up',
  });
}
