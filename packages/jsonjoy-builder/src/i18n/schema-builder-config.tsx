/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { ReactNode } from 'react';
import type { Translation } from './translation-keys';
import { createContext, useContext, useMemo } from 'react';
import { en } from './locales/en';

/** @public */
export interface SchemaBuilderProviderProps {
  locale?: Translation
  messages?: Partial<Translation>
  children?: ReactNode
}

const SchemaBuilderConfigContext = createContext<Translation>(en);

/** @public */
export function SchemaBuilderProvider({
  locale,
  messages,
  children,
}: SchemaBuilderProviderProps) {
  const parentLocale = useContext(SchemaBuilderConfigContext);
  const mergedLocale = useMemo(
    () => ({ ...parentLocale, ...locale, ...messages }),
    [parentLocale, locale, messages],
  );

  return (
    <SchemaBuilderConfigContext value={mergedLocale}>
      {children}
    </SchemaBuilderConfigContext>
  );
}

/** @public */
export function useSchemaBuilderConfig() {
  return useContext(SchemaBuilderConfigContext);
}
