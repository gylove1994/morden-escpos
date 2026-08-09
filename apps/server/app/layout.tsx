/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ReactNode } from 'react';
import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-sans-face',
});

const display = Source_Serif_4({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-display-face',
});

export const metadata = {
  title: 'morden-escpos console',
  description: 'BSL SaaS print-queue control plane',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
