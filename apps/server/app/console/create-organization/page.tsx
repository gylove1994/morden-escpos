/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { CreateOrganizationForm } from '../../components/auth-forms';
import { getConsoleSession } from '../../../lib/console-auth';

export default async function CreateOrganizationPage() {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (session.organization) {
    redirect('/console');
  }

  return (
    <section className="stack">
      <h1>Create an Organization</h1>
      <p className="muted">
        You become the Organization owner. Teammates can later join as admin or member.
      </p>
      <CreateOrganizationForm />
    </section>
  );
}
