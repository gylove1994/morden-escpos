/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { requireConsoleOrganization } from '../../../lib/console-guards';
import { listPrintJobs } from '../../../lib/jobs';
import { listPrinters } from '../../../lib/printers';
import { JobsPanel } from '../../components/jobs-panel';

export default async function JobsPage() {
  const session = await requireConsoleOrganization();

  const [jobs, printers] = await Promise.all([
    listPrintJobs(session.organization.id),
    listPrinters(session.organization.id),
  ]);

  return (
    <section className="stack">
      <h1>Print jobs</h1>
      <p className="muted">
        Enqueue raw ESC/POS work to a Printer and watch queued → leased →
        printing → succeeded | failed. Idempotency keys dedupe integrator retries.
      </p>
      <JobsPanel initialJobs={jobs} printers={printers} />
    </section>
  );
}
