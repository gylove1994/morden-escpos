/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import {
  canManageIntegratorAuth,
  getConsoleSession,
} from '../../../../lib/console-auth';
import {
  createIntegratorApiKey,
  listIntegratorApiKeys,
} from '../../../../lib/integrator-api-key';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
});

/**
 * List integrator API keys for the active Organization.
 * Any signed-in org member MAY list; plaintext keys are never returned.
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

  const apiKeys = await listIntegratorApiKeys(consoleSession.organization.id);
  return Response.json({ apiKeys });
}

/**
 * Create an integrator API key and return the plaintext once.
 * owner/admin MAY; member MUST NOT.
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

  if (!canManageIntegratorAuth(consoleSession.role)) {
    return Response.json(
      {
        error: 'forbidden',
        message: 'owner or admin role required to create an integrator API key',
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  }
  catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = CreateBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created = await createIntegratorApiKey({
    organizationId: consoleSession.organization.id,
    name: parsed.data.name,
  });

  return Response.json(
    {
      apiKey: created.apiKey,
      token: created.token,
      tokenShownOnce: true,
    },
    { status: 201 },
  );
}
