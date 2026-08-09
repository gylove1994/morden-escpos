/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { getSubscriptionSummary } from '../../../lib/billing/subscription';
import { SERVER_CONFIG } from '../../../lib/config';
import { getConsoleSession } from '../../../lib/console-auth';
import { isCloudEdition } from '../../../lib/edition';
import { BillingActions } from '../../components/billing-actions';

export default async function ConsoleBillingPage() {
  if (!isCloudEdition()) {
    redirect('/console');
  }

  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }
  if (!session.organization) {
    redirect('/console/create-organization');
  }

  const summary = await getSubscriptionSummary(session.organization.id);
  const canManageBilling = session.role === 'owner' || session.role === 'admin';

  return (
    <section className="stack">
      <h1>Billing</h1>
      <p>
        Plan:
        {' '}
        <strong>{summary.catalog.name}</strong>
        {' '}
        (
        {summary.status}
        )
      </p>
      <p className="muted">
        Limits are directional MVP defaults: printers
        {' '}
        {summary.usage.printers}
        /
        {summary.limits.maxPrinters}
        , Printer Agents
        {' '}
        {summary.usage.printerAgents}
        /
        {summary.limits.maxPrinterAgents}
        , monthly jobs
        {' '}
        {summary.usage.monthlyJobs}
        /
        {summary.limits.maxMonthlyJobs}
        .
      </p>
      <BillingActions
        resellerContactUrl={SERVER_CONFIG.BILLING_RESELLER_CONTACT_URL}
        canManageBilling={canManageBilling}
        hasStripeCustomer={Boolean(summary.stripeCustomerId)}
      />
    </section>
  );
}
