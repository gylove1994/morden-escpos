/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { PlatformTenantOps } from '../../components/platform-tenant-ops';

/**
 * Cloud-only platform tenant ops console.
 * Omitted from self-hosted builds via `page.cloud.tsx` + pageExtensions.
 */
export default function PlatformTenantOpsPage() {
  return (
    <section className="stack" data-testid="platform-tenant-ops">
      <h1>Platform tenant ops</h1>
      <p className="muted">
        Minimal cloud abuse controls: look up an Organization, then suspend or ban
        it. Requires
        {' '}
        <code>PLATFORM_ADMIN_SECRET</code>
        .
      </p>
      <PlatformTenantOps />
    </section>
  );
}
