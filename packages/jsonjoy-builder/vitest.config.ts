/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/**/*.{test,spec}.{js,ts,tsx}'],
  },
});
