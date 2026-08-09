/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import { getConsoleSession } from '../../../../lib/console-auth';
import {
  EnqueueTargetRequiredError,
  enqueueGroupJob,
  enqueueRawJob,
  enqueueTemplateJob,
  InvalidPayloadError,
  listPrintJobs,
  PrinterGroupNotEnqueueableError,
  PrinterNotEnqueueableError,
  TemplateNotFoundError,
  TemplateRenderError,
} from '../../../../lib/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TargetRefine = {
  message: 'Provide exactly one of printerId or printerGroupId',
} as const;

const RawEnqueueBodySchema = z.object({
  printerId: z.string().trim().min(1).optional(),
  printerGroupId: z.string().trim().min(1).optional(),
  payloadBase64: z.string().min(1),
  idempotencyKey: z.string().trim().min(1).max(200).optional(),
  purpose: z.enum(['standard', 'template_confirmation']).optional(),
}).refine(
  value => Boolean(value.printerId) !== Boolean(value.printerGroupId),
  TargetRefine,
);

const TemplateEnqueueBodySchema = z.object({
  printerId: z.string().trim().min(1).optional(),
  printerGroupId: z.string().trim().min(1).optional(),
  templateId: z.string().trim().min(1),
  inputs: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().trim().min(1).max(200).optional(),
  purpose: z.enum(['standard', 'template_confirmation']).optional(),
}).refine(
  value => Boolean(value.printerId) !== Boolean(value.printerGroupId),
  TargetRefine,
);

/**
 * List recent print jobs for the active Organization.
 * Any signed-in org member MAY list.
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
  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw ? Number(limitRaw) : 50;
  const jobs = await listPrintJobs(
    consoleSession.organization.id,
    Number.isFinite(limit) ? limit : 50,
  );
  return Response.json({ jobs });
}

/**
 * Enqueue a print job targeting a Printer or Printer Group.
 * Accepts either raw `payloadBase64` or `templateId + inputs` (server-rendered).
 * Group enqueue fans out to N child jobs under one parent aggregation job.
 * Set `purpose: "template_confirmation"` for embedded-editor confirmation prints.
 * Any signed-in org member MAY enqueue. Idempotency keys dedupe retries.
 */
export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const asRecord = body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : null;

  if (!asRecord) {
    return Response.json(
      { error: 'invalid_body', message: 'Enqueue body must be a JSON object' },
      { status: 400 },
    );
  }

  const isTemplateEnqueue = 'templateId' in asRecord;
  const isRawEnqueue = 'payloadBase64' in asRecord;

  if (isTemplateEnqueue === isRawEnqueue) {
    return Response.json(
      {
        error: 'invalid_body',
        message: 'Provide either payloadBase64 or templateId+inputs, not both',
      },
      { status: 400 },
    );
  }

  try {
    if (isTemplateEnqueue) {
      const parsed = TemplateEnqueueBodySchema.safeParse(body);
      if (!parsed.success) {
        const missingTarget = !asRecord.printerId && !asRecord.printerGroupId;
        return Response.json(
          {
            error: missingTarget ? 'target_required' : 'invalid_body',
            message: missingTarget
              ? 'Select a Printer or Printer Group before confirmation print'
              : 'Invalid template enqueue body',
            details: parsed.error.flatten(),
          },
          { status: 400 },
        );
      }

      const result = await enqueueTemplateJob({
        organizationId: consoleSession.organization.id,
        printerId: parsed.data.printerId,
        printerGroupId: parsed.data.printerGroupId,
        templateId: parsed.data.templateId,
        inputs: parsed.data.inputs,
        idempotencyKey: parsed.data.idempotencyKey,
        purpose: parsed.data.purpose,
      });

      return Response.json(
        {
          job: result.job,
          children: result.children,
          deduped: result.deduped,
        },
        { status: result.deduped ? 200 : 201 },
      );
    }

    const parsed = RawEnqueueBodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'invalid_body', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = parsed.data.printerGroupId
      ? await enqueueGroupJob({
          organizationId: consoleSession.organization.id,
          printerGroupId: parsed.data.printerGroupId,
          payloadBase64: parsed.data.payloadBase64,
          idempotencyKey: parsed.data.idempotencyKey,
          purpose: parsed.data.purpose,
        })
      : await enqueueRawJob({
          organizationId: consoleSession.organization.id,
          printerId: parsed.data.printerId!,
          payloadBase64: parsed.data.payloadBase64,
          idempotencyKey: parsed.data.idempotencyKey,
          purpose: parsed.data.purpose,
        });

    return Response.json(
      {
        job: result.job,
        children: result.children,
        deduped: result.deduped,
      },
      { status: result.deduped ? 200 : 201 },
    );
  }
  catch (error) {
    if (error instanceof InvalidPayloadError) {
      return Response.json(
        { error: 'invalid_payload', message: error.message },
        { status: 400 },
      );
    }
    if (error instanceof EnqueueTargetRequiredError) {
      return Response.json(
        { error: 'target_required', message: error.message },
        { status: 400 },
      );
    }
    if (error instanceof TemplateRenderError) {
      return Response.json(
        {
          error: 'invalid_template_inputs',
          message: error.message,
          details: error.errors,
        },
        { status: 400 },
      );
    }
    if (error instanceof TemplateNotFoundError) {
      return Response.json(
        { error: 'template_not_found', message: error.message },
        { status: 404 },
      );
    }
    if (error instanceof PrinterNotEnqueueableError) {
      return Response.json(
        { error: 'printer_not_enqueueable', message: error.message },
        { status: 404 },
      );
    }
    if (error instanceof PrinterGroupNotEnqueueableError) {
      const notFound = error.message.includes('not found');
      return Response.json(
        {
          error: notFound ? 'printer_group_not_found' : 'empty_printer_group',
          message: error.message,
        },
        { status: notFound ? 404 : 400 },
      );
    }
    throw error;
  }
}
