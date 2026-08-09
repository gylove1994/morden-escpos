/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { Buffer } from 'node:buffer';
import type { CheckoutPlanId } from './plans';
import Stripe from 'stripe';
import { SERVER_CONFIG } from '../config';

export interface CreateCheckoutSessionInput {
  organizationId: string
  plan: CheckoutPlanId
  priceId: string
  customerId?: string | null
  customerEmail: string
  successUrl: string
  cancelUrl: string
}

export interface CreateCheckoutSessionResult {
  id: string
  url: string
  customerId: string | null
}

export interface CreatePortalSessionInput {
  customerId: string
  returnUrl: string
}

export interface CreatePortalSessionResult {
  url: string
}

export interface StripeSubscriptionSnapshot {
  id: string
  customerId: string
  status: string
  priceId: string | null
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
}

/**
 * Stripe boundary used by billing routes.
 * Tests inject a fake adapter; production uses the Stripe SDK (test-mode keys).
 */
export interface StripeBillingPort {
  createCheckoutSession: (
    input: CreateCheckoutSessionInput,
  ) => Promise<CreateCheckoutSessionResult>
  createPortalSession: (
    input: CreatePortalSessionInput,
  ) => Promise<CreatePortalSessionResult>
  constructWebhookEvent: (
    payload: string | Buffer,
    signature: string,
  ) => Stripe.Event
  retrieveSubscription: (subscriptionId: string) => Promise<StripeSubscriptionSnapshot>
}

function requireStripeSecret(): string {
  const key = SERVER_CONFIG.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe billing operations');
  }
  return key;
}

function requireWebhookSecret(): string {
  const secret = SERVER_CONFIG.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required for Stripe webhooks');
  }
  return secret;
}

function toDate(seconds: number | null | undefined): Date | null {
  if (seconds == null)
    return null;
  return new Date(seconds * 1000);
}

function snapshotSubscription(sub: Stripe.Subscription): StripeSubscriptionSnapshot {
  const item = sub.items.data[0];
  const priceId = item?.price?.id ?? null;
  // Basil API: billing period lives on subscription items, not the subscription root.
  return {
    id: sub.id,
    customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    status: sub.status,
    priceId,
    currentPeriodStart: toDate(item?.current_period_start),
    currentPeriodEnd: toDate(item?.current_period_end),
  };
}

export function createStripeSdkPort(): StripeBillingPort {
  const stripe = new Stripe(requireStripeSecret(), {
    apiVersion: '2025-08-27.basil',
  });

  return {
    async createCheckoutSession(input) {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        customer: input.customerId ?? undefined,
        customer_email: input.customerId ? undefined : input.customerEmail,
        line_items: [{ price: input.priceId, quantity: 1 }],
        client_reference_id: input.organizationId,
        metadata: {
          organizationId: input.organizationId,
          plan: input.plan,
        },
        subscription_data: {
          metadata: {
            organizationId: input.organizationId,
            plan: input.plan,
          },
        },
      });

      if (!session.url) {
        throw new Error('Stripe Checkout session missing redirect URL');
      }

      const customerId
        = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null;

      return {
        id: session.id,
        url: session.url,
        customerId,
      };
    },

    async createPortalSession(input) {
      const session = await stripe.billingPortal.sessions.create({
        customer: input.customerId,
        return_url: input.returnUrl,
      });
      return { url: session.url };
    },

    constructWebhookEvent(payload, signature) {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        requireWebhookSecret(),
      );
    },

    async retrieveSubscription(subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      return snapshotSubscription(sub);
    },
  };
}

const globalForStripe = globalThis as typeof globalThis & {
  __mordenStripeBillingPort?: StripeBillingPort | null
};

export function getStripeBillingPort(): StripeBillingPort {
  // Prefer globalThis so Vitest and the in-process Next.js harness share one port
  // even when module graphs are duplicated.
  if (globalForStripe.__mordenStripeBillingPort) {
    return globalForStripe.__mordenStripeBillingPort;
  }
  const created = createStripeSdkPort();
  globalForStripe.__mordenStripeBillingPort = created;
  return created;
}

/** Test-only seam for injecting a fake Stripe adapter. */
export function setStripeBillingPortForTests(port: StripeBillingPort | null): void {
  globalForStripe.__mordenStripeBillingPort = port;
}
