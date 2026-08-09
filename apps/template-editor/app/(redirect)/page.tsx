/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { AppLocale } from '../../i18n/routing';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LOCALE_STORAGE_KEY = 'receipt-studio:locale:v1';

function detectLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'zh' || stored === 'en' || stored === 'ja') {
      return stored;
    }
  }
  catch {
    // Storage can be unavailable in privacy mode.
  }

  const language = navigator.language.toLowerCase();
  if (language.startsWith('zh')) {
    return 'zh';
  }
  if (language.startsWith('ja')) {
    return 'ja';
  }
  return language ? 'en' : 'zh';
}

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${detectLocale()}`);
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center text-sm text-muted-foreground">
      Opening Receipt Studio…
    </main>
  );
}
