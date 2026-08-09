/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import { cloudOnlyJsonResponse } from '../../../../lib/billing/cloud-guard';
import { getStripeBillingPort } from '../../../../lib/billing/stripe-port';
import { getOrCreateBilling } from '../../../../lib/billing/subscription';
import { SERVER_CONFIG } from '../../../../lib/config';
import {
  canManageOrganizationSettings,
  getConsoleSession,
} from '../../../../lib/console-auth';
import { isCloudEdition } from '../../../../lib/edition';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PortalBodySchema = z.object({
  returnUrl: z.url().optional(),
});

/**
 * Open Stripe Customer Portal for payment method / subscription management.
 */
export async function POST(request: Request) {
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

  const allowed = await canManageOrganizationSettings(request.headers);
  if (!allowed) {
    return Response.json(
      {
        error: 'forbidden',
        message: 'owner or admin role required to open Customer Portal',
      },
      { status: 403 },
    );
  }

  let body: unknown = {};
  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      body = await request.json();
    }
  }
  catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = PortalBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const billing = await getOrCreateBilling(consoleSession.organization.id);
  if (!billing.stripeCustomerId) {
    return Response.json(
      {
        error: 'no_stripe_customer',
        message: 'Start Checkout for Personal or Business before opening the Customer Portal',
      },
      { status: 400 },
    );
  }

  const returnUrl
    = parsed.data.returnUrl
      ?? `${SERVER_CONFIG.BASE_URL}/console/billing`;

  const session = await getStripeBillingPort().createPortalSession({
    customerId: billing.stripeCustomerId,
    returnUrl,
  });

  return Response.json({ url: session.url });
}
