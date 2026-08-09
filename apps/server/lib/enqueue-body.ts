/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import {
  enqueueRawJob,
  InvalidPayloadError,
  PrinterNotEnqueueableError,
} from './jobs';

export const EnqueueBodySchema = z.object({
  printerId: z.string().trim().min(1),
  payloadBase64: z.string().min(1),
  idempotencyKey: z.string().trim().min(1).max(200).optional(),
});

/**
 * Parse JSON enqueue body and create a raw job for the Organization.
 * Shared by console, integrator API, and webhook surfaces.
 */
export async function enqueueFromJsonBody(input: {
  organizationId: string
  body: unknown
}): Promise<Response> {
  const parsed = EnqueueBodySchema.safeParse(input.body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await enqueueRawJob({
      organizationId: input.organizationId,
      printerId: parsed.data.printerId,
      payloadBase64: parsed.data.payloadBase64,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    return Response.json(
      {
        job: result.job,
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
    if (error instanceof PrinterNotEnqueueableError) {
      return Response.json(
        { error: 'printer_not_enqueueable', message: error.message },
        { status: 404 },
      );
    }
    throw error;
  }
}
