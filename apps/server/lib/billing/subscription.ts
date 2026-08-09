/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { CheckoutPlanId, PlanId } from './plans';
import type { StripeSubscriptionSnapshot } from './stripe-port';
import { count, eq, sql } from 'drizzle-orm';
import { SERVER_CONFIG } from '../config';
import { db } from '../db';
import {
  organizationBilling,
  printerAgent,
  printer,
} from '../db/schema';
import { isCheckoutPlanId, isPlanId, PLAN_CATALOG, resolveEffectiveLimits } from './plans';

export type OrganizationBillingRow = typeof organizationBilling.$inferSelect;

export interface OrganizationUsage {
  printers: number
  printerAgents: number
  monthlyJobs: number
  monthlyJobPeriodKey: string
}

export function currentMonthlyPeriodKey(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function getOrCreateBilling(
  organizationId: string,
): Promise<OrganizationBillingRow> {
  const existing = await db.query.organizationBilling.findFirst({
    where: eq(organizationBilling.organizationId, organizationId),
  });
  if (existing) {
    return existing;
  }

  const periodKey = currentMonthlyPeriodKey();
  const [created] = await db
    .insert(organizationBilling)
    .values({
      organizationId,
      plan: 'none',
      status: 'none',
      monthlyJobCount: 0,
      monthlyJobPeriodKey: periodKey,
    })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return created;
  }

  const raced = await db.query.organizationBilling.findFirst({
    where: eq(organizationBilling.organizationId, organizationId),
  });
  if (!raced) {
    throw new Error(`Failed to create billing row for organization ${organizationId}`);
  }
  return raced;
}

export async function getOrganizationUsage(
  organizationId: string,
  billing?: OrganizationBillingRow,
): Promise<OrganizationUsage> {
  const row = billing ?? await getOrCreateBilling(organizationId);
  const periodKey = currentMonthlyPeriodKey();

  let monthlyJobs = row.monthlyJobCount;
  if (row.monthlyJobPeriodKey !== periodKey) {
    monthlyJobs = 0;
  }

  const [printerAgentsRow] = await db
    .select({ value: count() })
    .from(printerAgent)
    .where(eq(printerAgent.organizationId, organizationId));

  const [printersRow] = await db
    .select({ value: count() })
    .from(printer)
    .where(eq(printer.organizationId, organizationId));

  return {
    printers: Number(printersRow?.value ?? 0),
    printerAgents: Number(printerAgentsRow?.value ?? 0),
    monthlyJobs,
    monthlyJobPeriodKey: periodKey,
  };
}

export async function getSubscriptionSummary(organizationId: string) {
  const billing = await getOrCreateBilling(organizationId);
  const plan = isPlanId(billing.plan) ? billing.plan : 'none';
  const usage = await getOrganizationUsage(organizationId, billing);
  const limits = resolveEffectiveLimits(plan, billing.status);

  return {
    plan,
    status: billing.status,
    limits,
    usage: {
      printers: usage.printers,
      printerAgents: usage.printerAgents,
      monthlyJobs: usage.monthlyJobs,
    },
    stripeCustomerId: billing.stripeCustomerId,
    stripeSubscriptionId: billing.stripeSubscriptionId,
    catalog: PLAN_CATALOG[plan],
  };
}

export function priceIdForCheckoutPlan(plan: CheckoutPlanId): string {
  if (plan === 'personal') {
    const priceId = SERVER_CONFIG.STRIPE_PRICE_PERSONAL;
    if (!priceId) {
      throw new Error('STRIPE_PRICE_PERSONAL is not configured');
    }
    return priceId;
  }
  const priceId = SERVER_CONFIG.STRIPE_PRICE_BUSINESS;
  if (!priceId) {
    throw new Error('STRIPE_PRICE_BUSINESS is not configured');
  }
  return priceId;
}

export function planFromPriceId(priceId: string | null | undefined): CheckoutPlanId | null {
  if (!priceId)
    return null;
  if (priceId === SERVER_CONFIG.STRIPE_PRICE_PERSONAL)
    return 'personal';
  if (priceId === SERVER_CONFIG.STRIPE_PRICE_BUSINESS)
    return 'business';
  return null;
}

export async function rememberStripeCustomer(
  organizationId: string,
  stripeCustomerId: string,
): Promise<void> {
  await getOrCreateBilling(organizationId);
  await db
    .update(organizationBilling)
    .set({
      stripeCustomerId,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, organizationId));
}

export async function applyStripeSubscription(input: {
  organizationId: string
  plan?: PlanId | null
  subscription: StripeSubscriptionSnapshot
}): Promise<OrganizationBillingRow> {
  await getOrCreateBilling(input.organizationId);

  const planFromPrice = planFromPriceId(input.subscription.priceId);
  const plan: PlanId
    = input.plan && isPlanId(input.plan)
      ? input.plan
      : planFromPrice ?? 'none';

  const [updated] = await db
    .update(organizationBilling)
    .set({
      plan,
      status: input.subscription.status,
      stripeCustomerId: input.subscription.customerId,
      stripeSubscriptionId: input.subscription.id,
      stripePriceId: input.subscription.priceId,
      currentPeriodStart: input.subscription.currentPeriodStart,
      currentPeriodEnd: input.subscription.currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, input.organizationId))
    .returning();

  if (!updated) {
    throw new Error(`Failed to update billing for organization ${input.organizationId}`);
  }
  return updated;
}

export async function clearStripeSubscription(
  organizationId: string,
): Promise<void> {
  await getOrCreateBilling(organizationId);
  await db
    .update(organizationBilling)
    .set({
      plan: 'none',
      status: 'canceled',
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, organizationId));
}

/**
 * Test / ops helper: set plan entitlements without going through Stripe.
 * Production path is Stripe Checkout + webhook sync.
 */
export async function setOrganizationPlanForTests(input: {
  organizationId: string
  plan: PlanId
  status?: string
  stripeCustomerId?: string | null
}): Promise<OrganizationBillingRow> {
  await getOrCreateBilling(input.organizationId);
  const [updated] = await db
    .update(organizationBilling)
    .set({
      plan: input.plan,
      status: input.status ?? 'active',
      stripeCustomerId: input.stripeCustomerId ?? `cus_test_${input.organizationId}`,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, input.organizationId))
    .returning();
  if (!updated) {
    throw new Error('Failed to set organization plan for tests');
  }
  return updated;
}

export async function incrementMonthlyJobCount(
  organizationId: string,
): Promise<number> {
  const billing = await getOrCreateBilling(organizationId);
  const periodKey = currentMonthlyPeriodKey();

  if (billing.monthlyJobPeriodKey !== periodKey) {
    const [reset] = await db
      .update(organizationBilling)
      .set({
        monthlyJobCount: 1,
        monthlyJobPeriodKey: periodKey,
        updatedAt: new Date(),
      })
      .where(eq(organizationBilling.organizationId, organizationId))
      .returning();
    return reset?.monthlyJobCount ?? 1;
  }

  const [updated] = await db
    .update(organizationBilling)
    .set({
      monthlyJobCount: sql`${organizationBilling.monthlyJobCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, organizationId))
    .returning();

  return updated?.monthlyJobCount ?? billing.monthlyJobCount + 1;
}

export function isCheckoutPlan(value: string): value is CheckoutPlanId {
  return isCheckoutPlanId(value);
}
