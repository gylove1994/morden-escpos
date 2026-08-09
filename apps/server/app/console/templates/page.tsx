/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { canManageTemplates, getConsoleSession } from '../../../lib/console-auth';
import { listTemplates } from '../../../lib/templates';
import { TemplatesPanel } from '../../components/templates-panel';

export default async function TemplatesPage() {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (!session.organization) {
    redirect('/console/create-organization');
  }

  const templates = await listTemplates(session.organization.id);

  return (
    <section className="stack">
      <h1>Templates</h1>
      <p className="muted">
        Manage Organization JSON templates. Open the embedded MIT Receipt Studio
        editor to design, preview locally, and enqueue confirmation prints through
        the formal queue.
      </p>
      <TemplatesPanel
        initialTemplates={templates}
        canManage={canManageTemplates(session.role)}
      />
    </section>
  );
}
