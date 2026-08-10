/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { requireConsoleOrganization } from '../../../lib/console-guards';

export default async function PrinterGroupsPage() {
  await requireConsoleOrganization();

  return (
    <section className="stack">
      <h1>Printer Groups</h1>
      <p className="muted">
        Printer Group management lands in a later ticket. This route keeps the
        Organization business nav complete.
      </p>
    </section>
  );
}
