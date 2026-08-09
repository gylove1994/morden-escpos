/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { AppLocale } from '../../i18n/routing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/ui/select';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '../../i18n/navigation';

const LOCALE_STORAGE_KEY = 'receipt-studio:locale:v1';

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('LocaleSwitcher');

  function changeLocale(nextLocale: string) {
    const locale = nextLocale as AppLocale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
    catch {
      // Navigation still works when storage is unavailable.
    }
    router.replace(pathname, { locale });
  }

  return (
    <Select value={locale} onValueChange={changeLocale}>
      <SelectTrigger size="sm" className="w-26" aria-label={t('label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="zh">中文</SelectItem>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="ja">日本語</SelectItem>
      </SelectContent>
    </Select>
  );
}
