/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { PlanResource } from './errors';
import { PlanLimitError } from './errors';
import { isPlanId, resolveEffectiveLimits } from './plans';
import {
  getOrCreateBilling,
  getOrganizationUsage,
} from './subscription';

/**
 * Enforce cloud plan quotas at create/enqueue seams.
 *
 * Call before inserting a printer / Printer Agent or accepting a monthly job.
 * Throws PlanLimitError when the Organization is at or over quota.
 */
export async function assertPlanAllows(
  organizationId: string,
  resource: PlanResource,
): Promise<void> {
  const billing = await getOrCreateBilling(organizationId);
  const plan = isPlanId(billing.plan) ? billing.plan : 'none';
  const limits = resolveEffectiveLimits(plan, billing.status);
  const usage = await getOrganizationUsage(organizationId, billing);

  if (resource === 'printer') {
    if (usage.printers >= limits.maxPrinters) {
      throw new PlanLimitError({
        resource,
        limit: limits.maxPrinters,
        usage: usage.printers,
        plan,
        limits,
      });
    }
    return;
  }

  if (resource === 'printer_agent') {
    if (usage.printerAgents >= limits.maxPrinterAgents) {
      throw new PlanLimitError({
        resource,
        limit: limits.maxPrinterAgents,
        usage: usage.printerAgents,
        plan,
        limits,
      });
    }
    return;
  }

  if (usage.monthlyJobs >= limits.maxMonthlyJobs) {
    throw new PlanLimitError({
      resource,
      limit: limits.maxMonthlyJobs,
      usage: usage.monthlyJobs,
      plan,
      limits,
    });
  }
}
