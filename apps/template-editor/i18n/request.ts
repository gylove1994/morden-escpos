/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { en, zh } from '@workspace/jsonjoy-builder/locales';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

const messageLoaders = {
  en: () => import('../messages/en.json'),
  ja: () => import('../messages/ja.json'),
  zh: () => import('../messages/zh.json'),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const appMessages = (await messageLoaders[locale]()).default;
  const schemaBuilderMessages = locale === 'zh' ? zh : en;

  return {
    locale,
    messages: {
      ...appMessages,
      SchemaBuilder: {
        ...schemaBuilderMessages,
        ...appMessages.SchemaBuilder,
      },
    },
  };
});
