/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { Edition } from './edition-build';
import { SERVER_CONFIG } from './config';

export type { Edition } from './edition-build';
export {
  createAppRouterLeafRegex,
  isCloudOnlyAppEntry,
  matchesAppRouterPageOrRoute,
  matchesPageExtension,
  pageExtensionsForEdition,
} from './edition-build';

/**
 * Edition compile/build flag (`cloud` | `self-hosted`).
 *
 * Prefer `SERVER_CONFIG.EDITION` (env) and the `EDITION` value inlined by
 * `next.config.ts`. Cloud-only App Router files use the `*.cloud.ts(x)` suffix
 * and are omitted from self-hosted builds via `pageExtensions`.
 */
export const EDITION: Edition = SERVER_CONFIG.EDITION;

export function isCloudEdition(): boolean {
  return EDITION === 'cloud';
}

export function isSelfHostedEdition(): boolean {
  return EDITION === 'self-hosted';
}
