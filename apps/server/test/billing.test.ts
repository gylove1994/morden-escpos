/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type Stripe from 'stripe';
import type { StripeBillingPort } from '../lib/billing/stripe-port';
import type { BootedServer } from './harness';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PLAN_CATALOG } from '../lib/billing/plans';
import { setStripeBillingPortForTests } from '../lib/billing/stripe-port';
import {
  currentMonthlyPeriodKey,
  setOrganizationPlanForTests,
} from '../lib/billing/subscription';
import { SERVER_CONFIG } from '../lib/config';
import { db } from '../lib/db';
import { organizationBilling } from '../lib/db/schema';
import {
  authOriginHeaders,
  createOrganization,
  signUp,
} from './auth-helpers';
import { bootServer } from './harness';

function fakeStripePort(): StripeBillingPort {
  return {
    async createCheckoutSession(input) {
      return {
        id: `cs_test_${input.plan}`,
        url: `https://checkout.stripe.test/c/pay/cs_test_${input.plan}`,
        customerId: `cus_test_${input.organizationId}`,
      };
    },
    async createPortalSession(input) {
      return {
        url: `https://billing.stripe.test/p/session/${input.customerId}`,
      };
    },
    constructWebhookEvent(payload) {
      return JSON.parse(String(payload)) as Stripe.Event;
    },
    async retrieveSubscription(subscriptionId) {
      return {
        id: subscriptionId,
        // Unique per subscription so parallel/sequential orgs do not collide on
        // organization_billing.stripe_customer_id UNIQUE.
        customerId: `cus_for_${subscriptionId}`,
        status: 'active',
        priceId: SERVER_CONFIG.STRIPE_PRICE_PERSONAL ?? 'price_test_personal',
        currentPeriodStart: new Date('2026-08-01T00:00:00.000Z'),
        currentPeriodEnd: new Date('2026-09-01T00:00:00.000Z'),
      };
    },
  };
}

describe('cloud billing Stripe + plan limits', () => {
  let booted: BootedServer;
  const suffix = Date.now().toString(36);

  beforeAll(async () => {
    setStripeBillingPortForTests(fakeStripePort());
    booted = await bootServer({ port: 0 });
  }, 120_000);

  afterAll(async () => {
    setStripeBillingPortForTests(null);
    await booted.close();
  });

  async function signUpWithOrg(label: string) {
    const email = `${label}-${suffix}@example.com`;
    const signedUp = await signUp(booted.baseUrl, {
      name: label,
      email,
      password: 'correct-horse-battery',
    });
    expect(signedUp.response.status).toBeLessThan(300);

    const org = await createOrganization(booted.baseUrl, signedUp.cookie, {
      name: `${label} Org ${suffix}`,
      slug: `${label}-org-${suffix}`,
    });
    expect(org.response.status).toBeLessThan(300);
    const orgJson = await org.response.json() as { id: string };
    return { cookie: org.cookie, organizationId: orgJson.id, email };
  }

  it('lists Personal/Business checkout plans and Reseller contact-only', async () => {
    const response = await fetch(`${booted.baseUrl}/api/billing/plans`);
    expect(response.status).toBe(200);
    const body = await response.json() as {
      plans: Array<{
        id: string
        checkoutEligible: boolean
        contactUrl?: string
        priceUsdMonthly: number | null
      }>
    };

    const personal = body.plans.find(p => p.id === 'personal');
    const business = body.plans.find(p => p.id === 'business');
    const reseller = body.plans.find(p => p.id === 'reseller');

    expect(personal?.checkoutEligible).toBe(true);
    expect(business?.checkoutEligible).toBe(true);
    expect(personal?.priceUsdMonthly).toBe(1);
    expect(business?.priceUsdMonthly).toBe(5);
    expect(reseller?.checkoutEligible).toBe(false);
    expect(reseller?.contactUrl).toContain('mailto:');
  });

  it('creates Stripe Checkout for Personal/Business and opens Customer Portal', async () => {
    const { cookie } = await signUpWithOrg('checkout');

    const personalCheckout = await fetch(`${booted.baseUrl}/api/billing/checkout`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: cookie }),
      body: JSON.stringify({ plan: 'personal' }),
    });
    expect(personalCheckout.status).toBe(200);
    const personalBody = await personalCheckout.json() as { url: string, plan: string };
    expect(personalBody.plan).toBe('personal');
    expect(personalBody.url).toContain('checkout.stripe.test');

    const businessCheckout = await fetch(`${booted.baseUrl}/api/billing/checkout`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: cookie }),
      body: JSON.stringify({ plan: 'business' }),
    });
    expect(businessCheckout.status).toBe(200);
    const businessBody = await businessCheckout.json() as { url: string, plan: string };
    expect(businessBody.plan).toBe('business');
    expect(businessBody.url).toContain('cs_test_business');

    const portal = await fetch(`${booted.baseUrl}/api/billing/portal`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: cookie }),
      body: JSON.stringify({}),
    });
    expect(portal.status).toBe(200);
    const portalBody = await portal.json() as { url: string };
    expect(portalBody.url).toContain('billing.stripe.test');
  });

  it('rejects Reseller self-serve checkout with contact CTA', async () => {
    const { cookie } = await signUpWithOrg('reseller');

    const response = await fetch(`${booted.baseUrl}/api/billing/checkout`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: cookie }),
      body: JSON.stringify({ plan: 'reseller' }),
    });
    expect(response.status).toBe(400);
    const body = await response.json() as {
      error: string
      contactUrl: string
    };
    expect(body.error).toBe('reseller_contact_only');
    expect(body.contactUrl).toContain('mailto:');
  });

  it('syncs plan from Stripe webhook after Checkout', async () => {
    const { cookie, organizationId } = await signUpWithOrg('webhook');

    await fetch(`${booted.baseUrl}/api/billing/checkout`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: cookie }),
      body: JSON.stringify({ plan: 'personal' }),
    });

    const subscriptionId = `sub_test_personal_${organizationId}`;
    const event = {
      id: `evt_test_checkout_${organizationId}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_done_${organizationId}`,
          object: 'checkout.session',
          mode: 'subscription',
          customer: `cus_test_${organizationId}`,
          subscription: subscriptionId,
          client_reference_id: organizationId,
          metadata: { organizationId, plan: 'personal' },
        },
      },
    };

    const webhook = await fetch(`${booted.baseUrl}/api/billing/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature',
      },
      body: JSON.stringify(event),
    });
    expect(webhook.status).toBe(200);

    const subscription = await fetch(`${booted.baseUrl}/api/billing/subscription`, {
      headers: { Cookie: cookie },
    });
    expect(subscription.status).toBe(200);
    const body = await subscription.json() as {
      plan: string
      status: string
      limits: { maxPrinters: number }
    };
    expect(body.plan).toBe('personal');
    expect(body.status).toBe('active');
    expect(body.limits.maxPrinters).toBe(PLAN_CATALOG.personal.limits.maxPrinters);
  });

  it('rejects over-quota printer, Printer Agent, and monthly job at HTTP boundary', async () => {
    const { cookie, organizationId } = await signUpWithOrg('quota');

    await setOrganizationPlanForTests({
      organizationId,
      plan: 'personal',
      status: 'active',
    });

    const { maxPrinters, maxPrinterAgents, maxMonthlyJobs } = PLAN_CATALOG.personal.limits;

    for (let i = 0; i < maxPrinterAgents; i += 1) {
      const created = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: cookie }),
        body: JSON.stringify({ name: `Agent ${i}` }),
      });
      expect(created.status).toBe(201);
    }

    const overAgent = await fetch(`${booted.baseUrl}/api/console/printer-agents`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: cookie }),
      body: JSON.stringify({ name: 'Agent over quota' }),
    });
    expect(overAgent.status).toBe(403);
    const overAgentBody = await overAgent.json() as {
      error: string
      resource: string
      limit: number
    };
    expect(overAgentBody.error).toBe('plan_limit_exceeded');
    expect(overAgentBody.resource).toBe('printer_agent');
    expect(overAgentBody.limit).toBe(maxPrinterAgents);

    for (let i = 0; i < maxPrinters; i += 1) {
      const created = await fetch(`${booted.baseUrl}/api/console/printers`, {
        method: 'POST',
        headers: authOriginHeaders({ Cookie: cookie }),
        body: JSON.stringify({ name: `Printer ${i}` }),
      });
      expect(created.status).toBe(201);
    }

    const overPrinter = await fetch(`${booted.baseUrl}/api/console/printers`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: cookie }),
      body: JSON.stringify({ name: 'Printer over quota' }),
    });
    expect(overPrinter.status).toBe(403);
    const overPrinterBody = await overPrinter.json() as {
      error: string
      resource: string
    };
    expect(overPrinterBody.error).toBe('plan_limit_exceeded');
    expect(overPrinterBody.resource).toBe('printer');

    // Seed near the monthly quota, then prove one more enqueue is accepted and
    // the next is rejected at the HTTP boundary (avoid 100 round-trips).
    await db
      .update(organizationBilling)
      .set({
        monthlyJobCount: maxMonthlyJobs - 1,
        monthlyJobPeriodKey: currentMonthlyPeriodKey(),
        updatedAt: new Date(),
      })
      .where(eq(organizationBilling.organizationId, organizationId));

    const lastAllowed = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: cookie }),
      body: JSON.stringify({ target: 'printer', name: 'Job at limit' }),
    });
    expect(lastAllowed.status).toBe(201);

    const overJob = await fetch(`${booted.baseUrl}/api/console/jobs`, {
      method: 'POST',
      headers: authOriginHeaders({ Cookie: cookie }),
      body: JSON.stringify({ target: 'printer', name: 'Job over quota' }),
    });
    expect(overJob.status).toBe(403);
    const overJobBody = await overJob.json() as {
      error: string
      resource: string
      limit: number
    };
    expect(overJobBody.error).toBe('plan_limit_exceeded');
    expect(overJobBody.resource).toBe('monthly_job');
    expect(overJobBody.limit).toBe(maxMonthlyJobs);
  });
});
