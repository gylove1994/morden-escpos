/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import { useConsoleI18n } from '../../lib/i18n/client';
import type { ConsoleLocale } from '../../lib/i18n/locales';

export function LocaleSwitcher() {
  const { locale, messages, setLocale } = useConsoleI18n();

  return (
    <label className="locale-switcher">
      <span className="locale-switcher-label">{messages.shell.language}</span>
      <select
        aria-label={messages.shell.language}
        value={locale}
        onChange={(event) => {
          setLocale(event.target.value as ConsoleLocale);
        }}
      >
        <option value="en">{messages.shell.english}</option>
        <option value="zh">{messages.shell.chinese}</option>
      </select>
    </label>
  );
}
