/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { requireConsoleSession } from '../../../lib/console-guards';

export default async function ForbiddenPage() {
  await requireConsoleSession();

  return (
    <section data-experience="rbac-forbidden">
      <h1>Permission denied</h1>
      <p className="muted">
        Your RBAC role in this Organization cannot perform that action.
      </p>
      <p className="muted">
        This is not an Organization suspension or ban.
      </p>
      <p>
        <a href="/console" className="underline underline-offset-4">Back to Overview</a>
      </p>
    </section>
  );
}
