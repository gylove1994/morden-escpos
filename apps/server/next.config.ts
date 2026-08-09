/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { NextConfig } from 'next';
import { pageExtensionsForEdition, type Edition } from './lib/edition-build';

/**
 * Edition compile/build flag (`cloud` | `self-hosted`).
 *
 * Cloud-only App Router surfaces use the `*.cloud.ts(x)` suffix (billing +
 * platform tenant-ops). Self-hosted builds drop `cloud.ts` / `cloud.tsx` from
 * `pageExtensions`, so those routes are absent from the production output.
 */
const edition: Edition
  = process.env.EDITION === 'self-hosted' ? 'self-hosted' : 'cloud';

const nextConfig: NextConfig = {
  env: {
    EDITION: edition,
  },
  pageExtensions: pageExtensionsForEdition(edition),
  // MIT driver is used only for headless template → ESC/POS render at enqueue.
  transpilePackages: ['morden-node-escpos'],
  serverExternalPackages: ['usb', 'get-pixels', 'ndarray', 'qr-image', 'iconv-lite'],
};

export default nextConfig;
