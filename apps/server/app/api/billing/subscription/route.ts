/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { cloudOnlyJsonResponse } from '../../../../lib/billing/cloud-guard';
import { getSubscriptionSummary } from '../../../../lib/billing/subscription';
import { getConsoleSession } from '../../../../lib/console-auth';
import { isCloudEdition } from '../../../../lib/edition';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Current Organization plan, status, limits, and usage. */
export async function GET(request: Request) {
  if (!isCloudEdition()) {
    return cloudOnlyJsonResponse();
  }

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

  const summary = await getSubscriptionSummary(consoleSession.organization.id);
  return Response.json(summary);
}
