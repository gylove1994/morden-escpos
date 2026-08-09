/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { setRequestLocale } from 'next-intl/server';

import { EditorShell } from '../../components/editor/editor-shell';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EditorShell />;
}
