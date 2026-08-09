/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../../../lib/console-auth';
import { getConsoleMessages } from '../../../lib/i18n/server';
import { listConsolePrintJobs } from '../../../lib/jobs';
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

  const [{ messages }, jobs, printers] = await Promise.all([
    getConsoleMessages(),
    listConsolePrintJobs(session.organization.id),
    listPrinters(session.organization.id),
  ]);

  return (
    <section className="stack">
      <h1>{messages.jobs.title}</h1>
      <p className="muted">{messages.jobs.blurb}</p>
      <JobsPanel initialJobs={jobs} printers={printers} />
    </section>
  );
}
