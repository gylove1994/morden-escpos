import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import '@workspace/jsonjoy-builder/styles.css';

export const metadata: Metadata = {
  title: 'Receipt Studio',
  description: 'ESC/POS 热敏小票可视化模板编辑器',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
