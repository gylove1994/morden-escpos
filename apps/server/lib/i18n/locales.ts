/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */

/** MVP console locales — Chinese + English only (#14). */
export const CONSOLE_LOCALES = ['en', 'zh'] as const;

export type ConsoleLocale = (typeof CONSOLE_LOCALES)[number];

export const DEFAULT_CONSOLE_LOCALE: ConsoleLocale = 'en';

export const CONSOLE_LOCALE_COOKIE = 'console_locale';

export function isConsoleLocale(value: string | null | undefined): value is ConsoleLocale {
  return value === 'en' || value === 'zh';
}

export function parseConsoleLocale(value: string | null | undefined): ConsoleLocale {
  return isConsoleLocale(value) ? value : DEFAULT_CONSOLE_LOCALE;
}
