/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../../lib/console-auth';

export default async function ConsoleHomePage() {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (!session.organization) {
    redirect('/console/create-organization');
  }

  return (
    <section className="stack">
      <h1>Organization console</h1>
      <p>
        Signed in to
        {' '}
        <strong>{session.organization.name}</strong>
        {' '}
        (
        {session.organization.slug}
        ) as
        {' '}
        <strong>{session.role}</strong>
        .
      </p>
      <p className="muted">
        RBAC roles are owner, admin, and member. Updating Organization settings
        and managing Printer Agent device tokens require owner or admin. Cloud
        billing (Stripe Checkout + plan limits) is under Billing.
      </p>
      <p>
        <a href="/console/printer-agents">Manage Printer Agents</a>
        {' · '}
        <a href="/console/billing">Billing</a>
      </p>
    </section>
  );
}
