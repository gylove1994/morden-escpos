/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { getConsoleSession } from '../../../../lib/console-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Signed-in console session probe (human cookie session only).
 * Unauthenticated callers receive 401.
 */
export async function GET(request: Request) {
  const consoleSession = await getConsoleSession(request.headers);
  if (!consoleSession) {
    return Response.json(
      { error: 'unauthorized', message: 'Sign in required' },
      { status: 401 },
    );
  }

  return Response.json({
    user: consoleSession.user,
    organization: consoleSession.organization,
    role: consoleSession.role,
    authKind: 'human-session',
  });
}
