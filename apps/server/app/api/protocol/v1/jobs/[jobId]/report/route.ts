/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import {
  JobReportConflictError,
  reportJob,
} from '../../../../../../../lib/jobs';
import { requirePrinterAgentDeviceToken } from '../../../../../../../lib/protocol-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ReportBodySchema = z.object({
  status: z.enum(['printing', 'succeeded', 'failed']),
  errorMessage: z.string().trim().min(1).max(2000).optional(),
});

interface RouteContext {
  params: Promise<{ jobId: string }>
}

/**
 * Report job progress: printing → succeeded | failed.
 * Failure reports MUST include errorMessage.
 */
export async function POST(request: Request, context: RouteContext) {
  const authResult = await requirePrinterAgentDeviceToken(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { jobId } = await context.params;
  if (!jobId) {
    return Response.json(
      { error: 'invalid_job_id', message: 'jobId is required' },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json(
      { error: 'invalid_json', message: 'JSON body required' },
      { status: 400 },
    );
  }

  const parsed = ReportBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.status === 'failed' && !parsed.data.errorMessage) {
    return Response.json(
      {
        error: 'invalid_body',
        message: 'errorMessage is required when status is failed',
      },
      { status: 400 },
    );
  }

  try {
    const job = await reportJob({
      printerAgentId: authResult.printerAgent.id,
      organizationId: authResult.printerAgent.organizationId,
      jobId,
      status: parsed.data.status,
      errorMessage: parsed.data.errorMessage,
    });
    return Response.json({ job }, { status: 200 });
  }
  catch (error) {
    if (error instanceof JobReportConflictError) {
      return Response.json(
        { error: 'conflict', message: error.message },
        { status: 409 },
      );
    }
    throw error;
  }
}
