/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { timingSafeEqual } from 'node:crypto';
import { SERVER_CONFIG } from '../config';
import { isCloudEdition } from '../edition';

export class PlatformEditionError extends Error {
  readonly code = 'platform_cloud_only' as const;

  constructor() {
    super('Platform tenant-ops are available only on the cloud edition');
    this.name = 'PlatformEditionError';
  }
}

export class PlatformUnauthorizedError extends Error {
  readonly code = 'platform_unauthorized' as const;

  constructor() {
    super('Valid platform admin credentials required');
    this.name = 'PlatformUnauthorizedError';
  }
}

export function assertCloudPlatform(): void {
  if (!isCloudEdition()) {
    throw new PlatformEditionError();
  }
}

function secretsEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Authorize a platform tenant-ops request via `Authorization: Bearer <secret>`
 * matching `PLATFORM_ADMIN_SECRET`.
 */
export function assertPlatformAdmin(requestHeaders: Headers): void {
  assertCloudPlatform();

  const expected = SERVER_CONFIG.PLATFORM_ADMIN_SECRET;
  if (!expected) {
    throw new PlatformUnauthorizedError();
  }

  const header = requestHeaders.get('authorization');
  if (!header) {
    throw new PlatformUnauthorizedError();
  }

  const [scheme, token] = header.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new PlatformUnauthorizedError();
  }

  if (!secretsEqual(token, expected)) {
    throw new PlatformUnauthorizedError();
  }
}

export function platformCloudOnlyJsonResponse(): Response {
  return Response.json(
    {
      error: 'platform_cloud_only',
      message: 'Platform tenant-ops are available only on the cloud edition',
    },
    { status: 404 },
  );
}

export function platformUnauthorizedJsonResponse(): Response {
  return Response.json(
    {
      error: 'platform_unauthorized',
      message: 'Valid platform admin credentials required',
    },
    { status: 401 },
  );
}
