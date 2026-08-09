/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { z } from 'zod';
import { cloudOnlyJsonResponse } from '../../../../lib/billing/cloud-guard';
import { ResellerCheckoutError } from '../../../../lib/billing/errors';
import { CHECKOUT_PLANS, isCheckoutPlanId } from '../../../../lib/billing/plans';
import { getStripeBillingPort } from '../../../../lib/billing/stripe-port';
import {
  getOrCreateBilling,
  priceIdForCheckoutPlan,
  rememberStripeCustomer,
} from '../../../../lib/billing/subscription';
import { SERVER_CONFIG } from '../../../../lib/config';
import {
  canManageOrganizationSettings,
  getConsoleSession,
} from '../../../../lib/console-auth';
import { isCloudEdition } from '../../../../lib/edition';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CheckoutBodySchema = z.object({
  plan: z.enum(CHECKOUT_PLANS),
  successUrl: z.url().optional(),
  cancelUrl: z.url().optional(),
});

/**
 * Create a Stripe Checkout session for Personal or Business.
 * Reseller MUST NOT be accepted here — contact CTA only.
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
        message: 'owner or admin role required to start Checkout',
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

  // Explicit reseller rejection with contact CTA (even if schema would also reject).
  if (
    body
    && typeof body === 'object'
    && 'plan' in body
    && (body as { plan?: unknown }).plan === 'reseller'
  ) {
    const err = new ResellerCheckoutError(SERVER_CONFIG.BILLING_RESELLER_CONTACT_URL);
    return Response.json(err.toJSON(), { status: 400 });
  }

  const parsed = CheckoutBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!isCheckoutPlanId(parsed.data.plan)) {
    const err = new ResellerCheckoutError(SERVER_CONFIG.BILLING_RESELLER_CONTACT_URL);
    return Response.json(err.toJSON(), { status: 400 });
  }

  const organizationId = consoleSession.organization.id;
  const billing = await getOrCreateBilling(organizationId);
  const successUrl
    = parsed.data.successUrl
      ?? `${SERVER_CONFIG.BASE_URL}/console/billing?checkout=success`;
  const cancelUrl
    = parsed.data.cancelUrl
      ?? `${SERVER_CONFIG.BASE_URL}/console/billing?checkout=cancel`;

  const session = await getStripeBillingPort().createCheckoutSession({
    organizationId,
    plan: parsed.data.plan,
    priceId: priceIdForCheckoutPlan(parsed.data.plan),
    customerId: billing.stripeCustomerId,
    customerEmail: consoleSession.user.email,
    successUrl,
    cancelUrl,
  });

  if (session.customerId) {
    await rememberStripeCustomer(organizationId, session.customerId);
  }

  return Response.json({
    id: session.id,
    url: session.url,
    plan: parsed.data.plan,
  });
}
