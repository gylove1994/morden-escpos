/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/ui/card';
import { requireConsoleOrganization } from '../../../lib/console-guards';

export default async function PrinterGroupsPage() {
  await requireConsoleOrganization();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Printer Groups</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Group printers for routing and operations.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Printer Group management lands in a later ticket. This route keeps the
            Organization business nav complete.
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}
