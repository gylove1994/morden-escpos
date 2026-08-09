/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../../lib/console-auth';
import { getConsoleMessages } from '../../lib/i18n/server';

export default async function ConsoleHomePage() {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (!session.organization) {
    redirect('/console/create-organization');
  }

  const { messages } = await getConsoleMessages();

  return (
    <section className="stack">
      <h1>{messages.home.title}</h1>
      <p>
        {messages.home.signedInAs}
        {' '}
        <strong>{session.organization.name}</strong>
        {' '}
        (
        {session.organization.slug}
        )
        {' '}
        {messages.home.asRole}
        {' '}
        <strong>{session.role}</strong>
        .
      </p>
      <p className="muted">{messages.home.rbacBlurb}</p>
      <p className="stack">
        <a href="/console/printer-agents">{messages.home.managePrinterAgents}</a>
        {' · '}
        <a href="/console/billing">{messages.home.billing}</a>
        {' · '}
        <a href="/console/printers">{messages.home.managePrinters}</a>
        {' · '}
        <a href="/console/jobs">{messages.home.jobHistory}</a>
      </p>
    </section>
  );
}
