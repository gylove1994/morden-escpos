/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  matchesAppRouterPageOrRoute,
  pageExtensionsForEdition,
} from '../lib/edition-build';
import {
  discoverEditionAppRoutes,
  editionHasUrlPath,
} from '../lib/edition-routes';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(serverRoot, 'app');

const CLOUD_ONLY_URLS = [
  '/api/billing/checkout',
  '/api/billing/portal',
  '/api/billing/webhook',
  '/api/billing/plans',
  '/api/billing/subscription',
  '/api/platform/organizations',
  '/console/billing',
  '/console/platform',
] as const;

const RETAINED_SELF_HOSTED_URLS = [
  '/api/health',
  '/api/auth/[...all]',
  '/api/console/session',
  '/api/console/org-settings',
  '/api/console/printer-agents',
  '/api/console/printers',
  '/api/console/jobs',
  '/console',
  '/console/onboarding',
  '/console/suspended',
  '/console/forbidden',
  '/login',
  '/signup',
] as const;

describe('self-hosted edition compile-out', () => {
  it('omits *.cloud.ts(x) App Router entries from self-hosted pageExtensions', () => {
    const selfHostedExt = pageExtensionsForEdition('self-hosted');
    const cloudExt = pageExtensionsForEdition('cloud');

    // Next leaf matcher: `(^|/)(page|route).(${ext})$` — not naive endsWith('.ts').
    expect(matchesAppRouterPageOrRoute('/api/x/route.cloud.ts', selfHostedExt)).toBe(false);
    expect(matchesAppRouterPageOrRoute('/console/x/page.cloud.tsx', selfHostedExt)).toBe(false);
    expect(matchesAppRouterPageOrRoute('/api/x/route.ts', selfHostedExt)).toBe(true);

    expect(matchesAppRouterPageOrRoute('/api/x/route.cloud.ts', cloudExt)).toBe(true);
    expect(matchesAppRouterPageOrRoute('/console/x/page.cloud.tsx', cloudExt)).toBe(true);
    expect(matchesAppRouterPageOrRoute('/api/x/route.ts', cloudExt)).toBe(true);
  });

  it('discovers billing + platform routes for cloud but not self-hosted', () => {
    const cloudRoutes = discoverEditionAppRoutes(appDir, 'cloud');
    const selfHostedRoutes = discoverEditionAppRoutes(appDir, 'self-hosted');

    for (const urlPath of CLOUD_ONLY_URLS) {
      expect(editionHasUrlPath(cloudRoutes, urlPath), `cloud has ${urlPath}`).toBe(true);
      expect(
        editionHasUrlPath(selfHostedRoutes, urlPath),
        `self-hosted omits ${urlPath}`,
      ).toBe(false);
    }

    for (const urlPath of RETAINED_SELF_HOSTED_URLS) {
      expect(
        editionHasUrlPath(selfHostedRoutes, urlPath),
        `self-hosted retains ${urlPath}`,
      ).toBe(true);
    }
  });

  it('self-hosted next build omits cloud-only routes from the app-paths manifest', () => {
    // Proof against production output — not a runtime env hide.
    execFileSync(
      'pnpm',
      ['exec', 'dotenvx', 'run', '-f', './env.example.self-hosted', '--', 'next', 'build'],
      {
        cwd: serverRoot,
        env: {
          ...process.env,
          EDITION: 'self-hosted',
          NODE_ENV: 'production',
        },
        stdio: 'pipe',
        timeout: 300_000,
      },
    );

    const manifestPath = path.join(
      serverRoot,
      '.next',
      'server',
      'app-paths-manifest.json',
    );
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8'),
    ) as Record<string, string>;
    const paths = Object.keys(manifest);

    for (const urlPath of [
      '/api/billing/checkout',
      '/api/billing/portal',
      '/api/billing/webhook',
      '/api/billing/plans',
      '/api/billing/subscription',
      '/api/platform/organizations',
      '/console/billing',
      '/console/platform',
    ]) {
      const present = paths.some(
        key => key === urlPath || key.startsWith(`${urlPath}/`),
      );
      expect(present, `build manifest must omit ${urlPath}`).toBe(false);
    }

    for (const urlPath of [
      '/api/health',
      '/api/console/printer-agents',
      '/api/console/printers',
      '/api/console/jobs',
      '/console',
    ]) {
      const present = paths.some(
        key => key === urlPath || key.startsWith(`${urlPath}/`),
      );
      expect(present, `build manifest must retain ${urlPath}`).toBe(true);
    }
  }, 360_000);
});
