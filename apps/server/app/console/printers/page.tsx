/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { canManagePrinters } from '../../../lib/console-auth';
import { requireConsoleOrganization } from '../../../lib/console-guards';
import { listPrinterAgents } from '../../../lib/printer-agents';
import { listPrinters } from '../../../lib/printers';
import { PrintersPanel } from '../../components/printers-panel';

export default async function PrintersPage() {
  const session = await requireConsoleOrganization();

  const [printers, printerAgents] = await Promise.all([
    listPrinters(session.organization.id),
    listPrinterAgents(session.organization.id),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Printers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm Printers under a Printer Agent and attach connection hints.
          Leased jobs carry those hints so the on-site Printer Agent can open the
          correct local device.
        </p>
      </div>
      <PrintersPanel
        initialPrinters={printers}
        printerAgents={printerAgents}
        canManage={canManagePrinters(session.role)}
      />
    </section>
  );
}
