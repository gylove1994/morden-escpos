/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { getConsoleSession } from '../../../../../../lib/console-auth';
import {
  JobRetryConflictError,
  retryFailedChildJob,
} from '../../../../../../lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Retry a failed child job without re-running successful siblings.
 * Any signed-in org member MAY retry.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
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

  const { jobId } = await context.params;

  try {
    const result = await retryFailedChildJob({
      organizationId: consoleSession.organization.id,
      jobId,
    });
    return Response.json({
      job: result.job,
      parent: result.parent,
    });
  }
  catch (error) {
    if (error instanceof JobRetryConflictError) {
      const notFound = error.message.includes('not found');
      return Response.json(
        { error: notFound ? 'job_not_found' : 'job_not_retryable', message: error.message },
        { status: notFound ? 404 : 409 },
      );
    }
    throw error;
  }
}
