/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh', 'en', 'ja'],
  defaultLocale: 'zh',
  localePrefix: 'always',
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
