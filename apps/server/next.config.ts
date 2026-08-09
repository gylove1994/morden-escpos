/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { NextConfig } from 'next';

/**
 * Edition compile/build stub (`cloud` | `self-hosted`).
 * Route trimming is intentionally deferred; later tickets MAY use this value
 * (and `lib/edition.ts`) to omit cloud-only surfaces from self-hosted builds.
 */
const edition = process.env.EDITION === 'self-hosted' ? 'self-hosted' : 'cloud';

const nextConfig: NextConfig = {
  env: {
    EDITION: edition,
  },
};

export default nextConfig;
