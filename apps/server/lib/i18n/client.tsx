/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { ReactNode } from 'react';
import type { ConsoleLocale } from './locales';
import type { ConsoleMessages } from './messages';
import { useRouter } from 'next/navigation';
import {
  createContext,
  use,
  useEffect,
  useState,
} from 'react';
import {
  CONSOLE_LOCALE_COOKIE,
  isConsoleLocale,
} from './locales';
import { getMessages } from './messages';

interface I18nContextValue {
  locale: ConsoleLocale
  messages: ConsoleMessages
  setLocale: (locale: ConsoleLocale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null);

function writeLocaleCookie(locale: ConsoleLocale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${CONSOLE_LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function ConsoleI18nProvider({
  locale: initialLocale,
  messages: initialMessages,
  children,
}: {
  locale: ConsoleLocale
  messages: ConsoleMessages
  children: ReactNode
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setLocaleState(initialLocale);
    setMessages(initialMessages);
  }, [initialLocale, initialMessages]);

  function setLocale(next: ConsoleLocale) {
    if (!isConsoleLocale(next) || next === locale)
      return;
    writeLocaleCookie(next);
    setLocaleState(next);
    setMessages(getMessages(next));
    document.documentElement.lang = next;
    router.refresh();
  }

  return (
    <I18nContext value={{ locale, messages, setLocale }}>
      {children}
    </I18nContext>
  );
}

export function useConsoleI18n(): I18nContextValue {
  const value = use(I18nContext);
  if (!value) {
    throw new Error('useConsoleI18n must be used within ConsoleI18nProvider');
  }
  return value;
}
