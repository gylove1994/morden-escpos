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
import { requireConsoleSession } from '../../../lib/console-guards';

export default async function SuspendedOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireConsoleSession();
  const params = await searchParams;
  const status = params.status === 'banned' ? 'banned' : 'suspended';

  return (
    <section data-experience="organization-suspended" data-status={status}>
      <Card>
        <CardHeader>
          <CardTitle>
            Organization
            {' '}
            {status}
          </CardTitle>
          <CardDescription>
            {status === 'banned'
              ? 'This Organization is banned. Contact support if you believe this is a mistake.'
              : 'This Organization is suspended. Business actions are unavailable until it is restored.'}
          </CardDescription>
          <CardDescription>
            This is not a permissions error — your RBAC role is not the issue.
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}
