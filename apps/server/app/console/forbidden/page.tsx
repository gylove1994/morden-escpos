/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { Button } from '@workspace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/ui/card';
import { requireConsoleSession } from '../../../lib/console-guards';

export default async function ForbiddenPage() {
  await requireConsoleSession();

  return (
    <section data-experience="rbac-forbidden">
      <Card>
        <CardHeader>
          <CardTitle>Permission denied</CardTitle>
          <CardDescription>
            Your RBAC role in this Organization cannot perform that action.
          </CardDescription>
          <CardDescription>
            This is not an Organization suspension or ban.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary" size="sm">
            <a href="/console">Back to Overview</a>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
