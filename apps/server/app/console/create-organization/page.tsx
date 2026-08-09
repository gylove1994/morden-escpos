/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { CreateOrganizationForm } from '../../components/auth-forms';
import { getConsoleSession } from '../../../lib/console-auth';
import { getConsoleMessages } from '../../../lib/i18n/server';

export default async function CreateOrganizationPage() {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (session.organization) {
    redirect('/console');
  }

  const { messages } = await getConsoleMessages();

  return (
    <section className="stack">
      <h1>{messages.createOrg.title}</h1>
      <p className="muted">{messages.createOrg.blurb}</p>
      <CreateOrganizationForm />
    </section>
  );
}
