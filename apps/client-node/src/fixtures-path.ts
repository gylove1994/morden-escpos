/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Shared Print Queue Agent Protocol fixtures (also used by future Go client).
 * Located under apps/server/contracts/fixtures.
 */
export function getProtocolFixturesDir(): string {
  return path.resolve(moduleDir, '../../server/contracts/fixtures');
}

export function protocolFixturePath(name: string): string {
  return path.join(getProtocolFixturesDir(), name);
}
