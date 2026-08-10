/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { Badge } from '@workspace/ui/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/ui/card';
import { redirect } from 'next/navigation';
import { getSubscriptionSummary } from '../../../lib/billing/subscription';
import { SERVER_CONFIG } from '../../../lib/config';
import { requireConsoleOrganization } from '../../../lib/console-guards';
import { isCloudEdition } from '../../../lib/edition';
import { BillingActions } from '../../components/billing-actions';

export default async function ConsoleBillingPage() {
  if (!isCloudEdition()) {
    redirect('/console');
  }

  const session = await requireConsoleOrganization();

  const summary = await getSubscriptionSummary(session.organization.id);
  const canManageBilling = session.role === 'owner' || session.role === 'admin';

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cloud plan entitlements for the active Organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {summary.catalog.name}
            <Badge variant="secondary">{summary.status}</Badge>
          </CardTitle>
          <CardDescription>
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
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingActions
            resellerContactUrl={SERVER_CONFIG.BILLING_RESELLER_CONTACT_URL}
            canManageBilling={canManageBilling}
            hasStripeCustomer={Boolean(summary.stripeCustomerId)}
          />
        </CardContent>
      </Card>
    </section>
  );
}
