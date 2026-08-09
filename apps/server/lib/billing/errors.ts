/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { PlanLimits } from './plans';

export type PlanResource = 'printer' | 'printer_agent' | 'monthly_job';

export class PlanLimitError extends Error {
  readonly code = 'plan_limit_exceeded' as const;
  readonly resource: PlanResource;
  readonly limit: number;
  readonly usage: number;
  readonly plan: string;
  readonly limits: PlanLimits;

  constructor(input: {
    resource: PlanResource
    limit: number
    usage: number
    plan: string
    limits: PlanLimits
  }) {
    super(
      `Plan limit exceeded for ${input.resource}: usage ${input.usage} >= limit ${input.limit}`,
    );
    this.name = 'PlanLimitError';
    this.resource = input.resource;
    this.limit = input.limit;
    this.usage = input.usage;
    this.plan = input.plan;
    this.limits = input.limits;
  }

  toJSON() {
    return {
      error: this.code,
      resource: this.resource,
      limit: this.limit,
      usage: this.usage,
      plan: this.plan,
      limits: this.limits,
      message: this.message,
    };
  }
}

export class BillingEditionError extends Error {
  readonly code = 'billing_cloud_only' as const;

  constructor() {
    super('Billing is available only on the cloud edition');
    this.name = 'BillingEditionError';
  }
}

export class ResellerCheckoutError extends Error {
  readonly code = 'reseller_contact_only' as const;
  readonly contactUrl: string;

  constructor(contactUrl: string) {
    super('Reseller is contact CTA only; self-serve checkout is not available');
    this.name = 'ResellerCheckoutError';
    this.contactUrl = contactUrl;
  }

  toJSON() {
    return {
      error: this.code,
      contactUrl: this.contactUrl,
      message: this.message,
    };
  }
}
