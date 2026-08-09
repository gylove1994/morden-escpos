/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { cloudOnlyJsonResponse } from '../../../../lib/billing/cloud-guard';
import { getStripeBillingPort } from '../../../../lib/billing/stripe-port';
import { handleStripeWebhookEvent } from '../../../../lib/billing/webhook';
import { isCloudEdition } from '../../../../lib/edition';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook endpoint (test-mode or live).
 * Verifies signature via STRIPE_WEBHOOK_SECRET, then syncs Organization plan.
 */
export async function POST(request: Request) {
  if (!isCloudEdition()) {
    return cloudOnlyJsonResponse();
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return Response.json(
      { error: 'missing_signature', message: 'stripe-signature header required' },
      { status: 400 },
    );
  }

  const payload = await request.text();

  let event;
  try {
    event = getStripeBillingPort().constructWebhookEvent(payload, signature);
  }
  catch {
    return Response.json(
      { error: 'invalid_signature', message: 'Webhook signature verification failed' },
      { status: 400 },
    );
  }

  await handleStripeWebhookEvent(event);
  return Response.json({ received: true });
}
