/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Tags console requests with the shell plane so the console layout can render
 * Login/onboarding/business/platform chrome without path coupling in children.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/console')) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  let plane = 'business';
  if (pathname.startsWith('/console/platform')) {
    plane = 'platform';
  }
  else if (pathname.startsWith('/console/onboarding')) {
    plane = 'onboarding';
  }
  else if (
    pathname.startsWith('/console/suspended')
    || pathname.startsWith('/console/forbidden')
  ) {
    plane = 'status';
  }
  requestHeaders.set('x-console-plane', plane);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/console/:path*'],
};
