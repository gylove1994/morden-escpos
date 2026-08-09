/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { PrinterGroupsPanel } from '../../components/printer-groups-panel';
import {
  canManagePrinterGroups,
  getConsoleSession,
} from '../../../lib/console-auth';
import { listPrinterAgents } from '../../../lib/printer-agents';
import { listPrinterGroups } from '../../../lib/printer-groups';
import { listPrinters } from '../../../lib/printers';

export default async function PrinterGroupsPage() {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (!session.organization) {
    redirect('/console/create-organization');
  }

  const [printerGroups, printerAgents, printers] = await Promise.all([
    listPrinterGroups(session.organization.id),
    listPrinterAgents(session.organization.id),
    listPrinters(session.organization.id),
  ]);

  return (
    <section className="stack">
      <h1>Printer Groups</h1>
      <p className="muted">
        Define a Printer Group under exactly one Printer Agent. Enqueueing to a
        group fans out to every active member Printer as child jobs under one
        parent aggregation job.
      </p>
      <PrinterGroupsPanel
        initialGroups={printerGroups}
        printerAgents={printerAgents}
        printers={printers}
        canManage={canManagePrinterGroups(session.role)}
      />
    </section>
  );
}
