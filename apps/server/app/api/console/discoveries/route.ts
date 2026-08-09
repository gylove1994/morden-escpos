/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { getConsoleSession } from '../../../../lib/console-auth';
import { listDiscoveries } from '../../../../lib/discoveries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * List discovered endpoints for the active Organization.
 * Any signed-in org member MAY list. Query `?pending=1` for unconfirmed only.
 */
export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const pendingOnly = url.searchParams.get('pending') === '1'
    || url.searchParams.get('pending') === 'true';

  const discoveries = await listDiscoveries({
    organizationId: consoleSession.organization.id,
    pendingOnly,
  });

  return Response.json({ discoveries });
}
