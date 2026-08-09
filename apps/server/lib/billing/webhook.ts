/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { organizationBilling } from '../db/schema';
import { isCheckoutPlanId, isPlanId, type PlanId } from './plans';
import { getStripeBillingPort } from './stripe-port';
import {
  applyStripeSubscription,
  clearStripeSubscription,
  rememberStripeCustomer,
} from './subscription';

async function organizationIdFromCustomer(
  customerId: string,
): Promise<string | null> {
  const row = await db.query.organizationBilling.findFirst({
    where: eq(organizationBilling.stripeCustomerId, customerId),
  });
  return row?.organizationId ?? null;
}

function planFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): PlanId | null {
  const plan = metadata?.plan;
  if (!plan) return null;
  if (isCheckoutPlanId(plan) || isPlanId(plan)) return plan;
  return null;
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const stripe = getStripeBillingPort();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') return;

      const organizationId
        = session.metadata?.organizationId
          ?? session.client_reference_id
          ?? null;
      if (!organizationId) return;

      const customerId
        = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null;
      if (customerId) {
        await rememberStripeCustomer(organizationId, customerId);
      }

      const subscriptionId
        = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null;
      if (!subscriptionId) return;

      const subscription = await stripe.retrieveSubscription(subscriptionId);
      await applyStripeSubscription({
        organizationId,
        plan: planFromMetadata(session.metadata),
        subscription,
      });
      return;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const organizationId
        = sub.metadata?.organizationId
          ?? await organizationIdFromCustomer(customerId);
      if (!organizationId) return;

      const subscription = await stripe.retrieveSubscription(sub.id);
      await applyStripeSubscription({
        organizationId,
        plan: planFromMetadata(sub.metadata),
        subscription,
      });
      return;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const organizationId
        = sub.metadata?.organizationId
          ?? await organizationIdFromCustomer(customerId);
      if (!organizationId) return;
      await clearStripeSubscription(organizationId);
      return;
    }

    default:
      // Ignore unrelated Stripe events.
      return;
  }
}
