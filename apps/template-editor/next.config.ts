/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const githubPagesBasePath = '/morden-escpos';
const withNextIntl = createNextIntlPlugin();

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

export default withNextIntl(nextConfig);
