/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { canManagePrinterAgents } from '../../../lib/console-auth';
import { requireConsoleOrganization } from '../../../lib/console-guards';
import { listPrinterAgents } from '../../../lib/printer-agents';
import { PrinterAgentsPanel } from '../../components/printer-agents-panel';

export default async function PrinterAgentsPage() {
  const session = await requireConsoleOrganization();

  const printerAgents = await listPrinterAgents(session.organization.id);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Printer Agents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register on-site Printer Agents and manage device tokens. Tokens are shown
          once on create or rotate and stored hashed at rest. This is separate from
          human session cookies.
        </p>
      </div>
      <PrinterAgentsPanel
        initialPrinterAgents={printerAgents}
        canManage={canManagePrinterAgents(session.role)}
      />
    </section>
  );
}
