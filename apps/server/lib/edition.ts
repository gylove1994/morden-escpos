/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { SERVER_CONFIG } from './config';

export type Edition = 'cloud' | 'self-hosted';

/**
 * Edition compile/build stub.
 *
 * Prefer `SERVER_CONFIG.EDITION` (env) and the `EDITION` value inlined by
 * `next.config.ts`. Full route trimming for self-hosted builds is out of scope
 * for the scaffold ticket; callers SHOULD use these helpers when that lands.
 */
export const EDITION: Edition = SERVER_CONFIG.EDITION;

export function isCloudEdition(): boolean {
  return EDITION === 'cloud';
}

export function isSelfHostedEdition(): boolean {
  return EDITION === 'self-hosted';
}
