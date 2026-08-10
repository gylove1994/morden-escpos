/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { cookies, headers } from 'next/headers';
import { consoleAuthMessages } from './console-messages/auth';

export const CONSOLE_LOCALE_COOKIE = 'console_locale';
export type ConsoleLocale = 'en' | 'zh';

export function isConsoleLocale(value: string | undefined | null): value is ConsoleLocale {
  return value === 'en' || value === 'zh';
}

/**
 * Resolves console locale from the `console_locale` cookie, then Accept-Language.
 */
export async function getConsoleLocale(): Promise<ConsoleLocale> {
  const jar = await cookies();
  const fromCookie = jar.get(CONSOLE_LOCALE_COOKIE)?.value;
  if (isConsoleLocale(fromCookie)) {
    return fromCookie;
  }

  const accept = (await headers()).get('accept-language') ?? '';
  if (/(?:^|,)\s*zh\b/i.test(accept)) {
    return 'zh';
  }
  return 'en';
}

export async function getConsoleAuthLocalization() {
  const locale = await getConsoleLocale();
  return consoleAuthMessages[locale];
}
