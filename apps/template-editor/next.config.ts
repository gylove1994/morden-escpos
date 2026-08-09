/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const githubPagesBasePath = '/morden-escpos';

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        assetPrefix: githubPagesBasePath,
        basePath: githubPagesBasePath,
        trailingSlash: true,
      }
    : {}),
  output: 'export',
  transpilePackages: ['@workspace/jsonjoy-builder', '@workspace/ui'],
};

export default nextConfig;
