/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */

/**
 * Cloud plan catalog and directional MVP quotas.
 *
 * Dollar amounts and numeric limits are directional defaults from the product
 * spec (#1 / #15). They MAY change before launch without changing architecture.
 */

export const CHECKOUT_PLANS = ['personal', 'business'] as const;
export type CheckoutPlanId = (typeof CHECKOUT_PLANS)[number];

export const PLAN_IDS = ['none', 'personal', 'business', 'reseller'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export interface PlanLimits {
  maxPrinters: number
  maxPrinterAgents: number
  maxMonthlyJobs: number
}

export interface PlanCatalogEntry {
  id: PlanId
  name: string
  /** Directional list price in USD per month; null for contact-only / none. */
  priceUsdMonthly: number | null
  checkoutEligible: boolean
  limits: PlanLimits
  summary: string
}

const ZERO_LIMITS: PlanLimits = {
  maxPrinters: 0,
  maxPrinterAgents: 0,
  maxMonthlyJobs: 0,
};

/**
 * Directional quotas used for enforcement until marketing finalizes numbers.
 * Personal ~$1/mo (tight), Business ~$5+/mo (higher), Reseller negotiated.
 */
export const PLAN_CATALOG: Record<PlanId, PlanCatalogEntry> = {
  none: {
    id: 'none',
    name: 'None',
    priceUsdMonthly: null,
    checkoutEligible: false,
    limits: ZERO_LIMITS,
    summary: 'No active cloud subscription.',
  },
  personal: {
    id: 'personal',
    name: 'Personal',
    priceUsdMonthly: 1,
    checkoutEligible: true,
    limits: {
      maxPrinters: 2,
      maxPrinterAgents: 1,
      maxMonthlyJobs: 100,
    },
    summary: 'Hobby cloud plan with tight limits on printers, Printer Agents, and monthly jobs.',
  },
  business: {
    id: 'business',
    name: 'Business',
    priceUsdMonthly: 5,
    checkoutEligible: true,
    limits: {
      maxPrinters: 25,
      maxPrinterAgents: 5,
      maxMonthlyJobs: 5_000,
    },
    summary: 'Small-business cloud plan with higher quotas.',
  },
  reseller: {
    id: 'reseller',
    name: 'Reseller',
    priceUsdMonthly: null,
    checkoutEligible: false,
    limits: {
      maxPrinters: 1_000,
      maxPrinterAgents: 100,
      maxMonthlyJobs: 100_000,
    },
    summary: 'Negotiated platform or reseller pricing — contact CTA only, not self-serve checkout.',
  },
};

export function isCheckoutPlanId(value: string): value is CheckoutPlanId {
  return (CHECKOUT_PLANS as readonly string[]).includes(value);
}

export function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

/**
 * Active entitlements: active/trialing subscriptions grant their plan limits.
 * past_due / canceled / none grant zero until billing is restored.
 */
export function resolveEffectiveLimits(
  plan: PlanId,
  status: string,
): PlanLimits {
  if (status !== 'active' && status !== 'trialing') {
    return ZERO_LIMITS;
  }
  return PLAN_CATALOG[plan].limits;
}

export function listPublicPlans(resellerContactUrl: string): Array<
  PlanCatalogEntry & { contactUrl?: string }
> {
  return (['personal', 'business', 'reseller'] as const).map((id) => {
    const entry = PLAN_CATALOG[id];
    if (id === 'reseller') {
      return { ...entry, contactUrl: resellerContactUrl };
    }
    return entry;
  });
}
