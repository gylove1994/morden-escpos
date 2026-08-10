/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { Badge } from '@workspace/ui/components/ui/badge';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/ui/card';
import { requireConsoleOrganization } from '../../lib/console-guards';

export default async function ConsoleHomePage() {
  const session = await requireConsoleOrganization();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Active Organization context for this human session.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{session.organization.name}</CardTitle>
          <CardDescription>
            Slug
            {' '}
            {session.organization.slug}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">RBAC role</span>
            <Badge variant="secondary">{session.role}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            RBAC roles are owner, admin, and member. Updating Organization settings,
            managing Printer Agent device tokens, and confirming Printers require
            owner or admin. Members may enqueue raw jobs and view job status. Cloud
            billing (Stripe Checkout + plan limits) is under Billing.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href="/console/printer-agents">Printer Agents</a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href="/console/printers">Printers</a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href="/console/jobs">Jobs</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/console/billing">Billing</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
