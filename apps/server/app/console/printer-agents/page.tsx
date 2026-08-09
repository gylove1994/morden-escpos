/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import {
  canManagePrinterAgents,
  getConsoleSession,
} from '../../../lib/console-auth';
import { getConsoleMessages } from '../../../lib/i18n/server';
import { listPrinterAgents } from '../../../lib/printer-agents';
import { PrinterAgentsPanel } from '../../components/printer-agents-panel';

export default async function PrinterAgentsPage() {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (!session.organization) {
    redirect('/console/create-organization');
  }

  const [{ messages }, printerAgents] = await Promise.all([
    getConsoleMessages(),
    listPrinterAgents(session.organization.id),
  ]);

  return (
    <section className="stack">
      <h1>{messages.printerAgents.title}</h1>
      <p className="muted">{messages.printerAgents.blurb}</p>
      <PrinterAgentsPanel
        initialPrinterAgents={printerAgents}
        canManage={canManagePrinterAgents(session.role)}
      />
    </section>
  );
}
