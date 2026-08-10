/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { NextResponse } from 'next/server';
import {
  CONSOLE_LOCALE_COOKIE,
  isConsoleLocale,
} from '../../../../lib/console-locale';

/**
 * Persists console locale and redirects back to the requested console path.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale');
  const nextPath = url.searchParams.get('next') ?? '/login';
  const safeNext = nextPath.startsWith('/') ? nextPath : '/login';

  if (!isConsoleLocale(locale)) {
    return NextResponse.redirect(new URL(safeNext, url.origin));
  }

  const response = NextResponse.redirect(new URL(safeNext, url.origin));
  response.cookies.set(CONSOLE_LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
  });
  return response;
}
