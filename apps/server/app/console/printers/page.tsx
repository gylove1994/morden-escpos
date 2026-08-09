/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import {
  canManagePrinters,
  getConsoleSession,
} from '../../../lib/console-auth';
import { getConsoleMessages } from '../../../lib/i18n/server';
import { listPrinterAgents } from '../../../lib/printer-agents';
import { listPrinters } from '../../../lib/printers';
import { PrintersPanel } from '../../components/printers-panel';

export default async function PrintersPage() {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (!session.organization) {
    redirect('/console/create-organization');
  }

  const [{ messages }, printers, printerAgents] = await Promise.all([
    getConsoleMessages(),
    listPrinters(session.organization.id),
    listPrinterAgents(session.organization.id),
  ]);

  return (
    <section className="stack">
      <h1>{messages.printers.title}</h1>
      <p className="muted">{messages.printers.blurb}</p>
      <PrintersPanel
        initialPrinters={printers}
        printerAgents={printerAgents}
        canManage={canManagePrinters(session.role)}
      />
    </section>
  );
}
