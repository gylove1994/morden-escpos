/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { ReactNode } from 'react';
import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import { ConsoleI18nProvider } from '../lib/i18n/client';
import { getConsoleMessages } from '../lib/i18n/server';
import './globals.css';

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Source_Serif_4({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: 'morden-escpos console',
  description: 'BSL SaaS print-queue control plane',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale, messages } = await getConsoleMessages();

  return (
    <html lang={locale} className={`${sans.variable} ${display.variable}`}>
      <body>
        <ConsoleI18nProvider locale={locale} messages={messages}>
          {children}
        </ConsoleI18nProvider>
      </body>
    </html>
  );
}
