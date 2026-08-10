/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
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
      <h1>
        Organization
        {' '}
        {status}
      </h1>
      <p className="muted">
        {status === 'banned'
          ? 'This Organization is banned. Contact support if you believe this is a mistake.'
          : 'This Organization is suspended. Business actions are unavailable until it is restored.'}
      </p>
      <p className="muted">
        This is not a permissions error — your RBAC role is not the issue.
      </p>
    </section>
  );
}
