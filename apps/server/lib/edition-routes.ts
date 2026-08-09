/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { Edition } from './edition-build';
import fs from 'node:fs';
import path from 'node:path';
import {
  matchesAppRouterPageOrRoute,
  pageExtensionsForEdition,
} from './edition-build';

export interface DiscoveredAppRoute {
  /** Posix-style path under `app/`, e.g. `api/billing/checkout/route.cloud.ts`. */
  relativePath: string
  /** URL path inferred from folders, e.g. `/api/billing/checkout`. */
  urlPath: string
  kind: 'page' | 'route'
}

function toUrlPath(relativePath: string): string {
  const segments = relativePath.split('/');
  segments.pop(); // filename
  const urlSegments = segments.filter((segment) => {
    if (segment.startsWith('(') && segment.endsWith(')')) {
      return false;
    }
    return true;
  });
  if (urlSegments.length === 0) {
    return '/';
  }
  return `/${urlSegments.join('/')}`;
}

function walk(dir: string, baseDir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) {
        continue;
      }
      walk(full, baseDir, out);
      continue;
    }
    if (entry.isFile()) {
      out.push(path.relative(baseDir, full));
    }
  }
}

/**
 * Discover App Router page/route modules that Next would include for `edition`,
 * using the same leaf `pageExtensions` rules as `next.config.ts` / Next.js.
 */
export function discoverEditionAppRoutes(
  appDir: string,
  edition: Edition,
): DiscoveredAppRoute[] {
  const pageExtensions = pageExtensionsForEdition(edition);
  const files: string[] = [];
  walk(appDir, appDir, files);

  const discovered: DiscoveredAppRoute[] = [];
  for (const relative of files) {
    const normalized = relative.split(path.sep).join('/');
    // Match against a path form Next's regex accepts (`/.../route.ts`).
    const probePath = `/${normalized}`;
    if (!matchesAppRouterPageOrRoute(probePath, pageExtensions)) {
      continue;
    }
    const filename = path.basename(normalized);
    const kind = filename.startsWith('route.')
      ? 'route'
      : filename.startsWith('page.')
        ? 'page'
        : null;
    if (!kind) {
      continue;
    }
    discovered.push({
      relativePath: normalized,
      urlPath: toUrlPath(normalized),
      kind,
    });
  }

  return discovered.sort((a, b) => a.urlPath.localeCompare(b.urlPath));
}

export function editionHasUrlPath(
  routes: readonly DiscoveredAppRoute[],
  urlPath: string,
): boolean {
  return routes.some(route => route.urlPath === urlPath);
}
