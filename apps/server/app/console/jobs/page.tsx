/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../../../lib/console-auth';
import { listPrintJobs } from '../../../lib/jobs';
import { listPrinterGroups } from '../../../lib/printer-groups';
import { listPrinters } from '../../../lib/printers';
import { JobsPanel } from '../../components/jobs-panel';

export default async function JobsPage() {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (!session.organization) {
    redirect('/console/create-organization');
  }

  const [jobs, printers, printerGroups] = await Promise.all([
    listPrintJobs(session.organization.id),
    listPrinters(session.organization.id),
    listPrinterGroups(session.organization.id),
  ]);

  return (
    <section className="stack">
      <h1>Print jobs</h1>
      <p className="muted">
        Enqueue raw ESC/POS work to a Printer or Printer Group. Group targets
        expand into child jobs under one parent; failed children can be retried
        without reprinting successful siblings.
      </p>
      <JobsPanel
        initialJobs={jobs}
        printers={printers}
        printerGroups={printerGroups}
      />
    </section>
  );
}
