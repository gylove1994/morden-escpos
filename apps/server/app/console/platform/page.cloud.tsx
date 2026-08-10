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
    <section className="flex flex-col gap-4" data-testid="platform-tenant-ops">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform tenant ops</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Minimal cloud abuse controls: look up an Organization, then suspend or ban
          it. Requires
          {' '}
          <code>PLATFORM_ADMIN_SECRET</code>
          .
        </p>
      </div>
      <PlatformTenantOps />
    </section>
  );
}
