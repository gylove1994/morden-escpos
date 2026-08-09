/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { cookies } from 'next/headers';
import {
  CONSOLE_LOCALE_COOKIE,
  DEFAULT_CONSOLE_LOCALE,
  parseConsoleLocale,
  type ConsoleLocale,
} from './locales';
import { getMessages, type ConsoleMessages } from './messages';

export async function getConsoleLocale(): Promise<ConsoleLocale> {
  const jar = await cookies();
  return parseConsoleLocale(jar.get(CONSOLE_LOCALE_COOKIE)?.value);
}

export async function getConsoleMessages(): Promise<{
  locale: ConsoleLocale
  messages: ConsoleMessages
}> {
  const locale = await getConsoleLocale();
  return { locale, messages: getMessages(locale) };
}

export { CONSOLE_LOCALE_COOKIE, DEFAULT_CONSOLE_LOCALE };
