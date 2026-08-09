/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */

/**
 * Build-time edition helpers safe to import from `next.config.ts`.
 * MUST NOT import `SERVER_CONFIG` (startup env validation).
 */

export type Edition = 'cloud' | 'self-hosted';

/** App Router file extensions discovered for the given edition. */
export function pageExtensionsForEdition(edition: Edition): string[] {
  if (edition === 'cloud') {
    // Longer compound extensions first — matches Next's getPageFromPath sort.
    return ['cloud.ts', 'cloud.tsx', 'ts', 'tsx', 'js', 'jsx'];
  }
  return ['ts', 'tsx', 'js', 'jsx'];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Next.js App Router leaf matcher for `page` / `route` files.
 * Mirrors `createValidFileMatcher` in `next/dist/server/lib/find-page-file.js`:
 * `(^|/)(page|route).(${pageExtensions})$` — so `route.cloud.ts` is NOT a
 * self-hosted route when extensions are only `ts`/`tsx`.
 */
export function createAppRouterLeafRegex(
  pageExtensions: readonly string[],
  bases: readonly string[] = ['page', 'route'],
): RegExp {
  const extPattern = `(?:${pageExtensions.map(escapeRegExp).join('|')})`;
  const names = bases.length === 1 ? bases[0]! : `(${bases.join('|')})`;
  return new RegExp(`(^${names}|[\\\\/]${names})\\.${extPattern}$`);
}

/**
 * Whether a path/filename is an App Router page or route module for the given
 * `pageExtensions` (Next leaf-file semantics, not naive `endsWith('.ts')`).
 */
export function matchesAppRouterPageOrRoute(
  filePath: string,
  pageExtensions: readonly string[],
): boolean {
  return createAppRouterLeafRegex(pageExtensions).test(filePath);
}

/** @deprecated Use matchesAppRouterPageOrRoute — kept as a thin alias. */
export function matchesPageExtension(
  filename: string,
  pageExtensions: readonly string[],
): boolean {
  return matchesAppRouterPageOrRoute(filename, pageExtensions);
}

/**
 * True when `filename` is a cloud-only App Router entry (`page.cloud.tsx`,
 * `route.cloud.ts`, …).
 */
export function isCloudOnlyAppEntry(filename: string): boolean {
  return /^(page|route|layout|loading|error|not-found|template|default)\.cloud\.(ts|tsx|js|jsx)$/.test(
    filename,
  );
}
