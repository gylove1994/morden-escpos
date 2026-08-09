/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '../globals.css';
import '@workspace/jsonjoy-builder/styles.css';

export const metadata: Metadata = {
  title: 'Receipt Studio',
  description: 'A visual ESC/POS receipt template editor.',
};

export default function RedirectLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
