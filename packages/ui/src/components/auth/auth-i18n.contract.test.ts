import type { AuthMessages } from '#lib/auth-i18n';
/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import {

  createAuthLocalization,
} from '#lib/auth-i18n';

const authDir = path.dirname(fileURLToPath(import.meta.url));

describe('better Auth UI injectable i18n contract', () => {
  it('exposes createAuthLocalization that injects auth message overlays', () => {
    const en: AuthMessages = {
      auth: {
        signIn: 'Sign in',
        signUp: 'Create account',
        email: 'Email',
        password: 'Password',
      },
    };
    const zh: AuthMessages = {
      auth: {
        signIn: '登录',
        signUp: '创建账户',
        email: '邮箱',
        password: '密码',
      },
    };

    expect(createAuthLocalization(en).auth?.signIn).toBe('Sign in');
    expect(createAuthLocalization(zh).auth?.signIn).toBe('登录');
    expect(createAuthLocalization(zh).auth?.email).toBe('邮箱');
  });

  it('keeps Storybook auth stories able to switch en and zh overlays', () => {
    const stories = readFileSync(path.join(authDir, 'auth.stories.tsx'), 'utf8');

    expect(stories).toMatch(/title:\s*['"]ui\/patterns\/Auth['"]/);
    expect(stories).toContain('createAuthLocalization');
    expect(stories).toMatch(/locale:\s*['"]en['"]/);
    expect(stories).toMatch(/locale:\s*['"]zh['"]/);
    expect(stories).toContain('登录');
    expect(stories).toContain('Sign in');
  });

  it('ships Better Auth UI auth surface files from the registry', () => {
    const required = [
      'auth-provider.tsx',
      'auth.tsx',
      'sign-in.tsx',
      'sign-up.tsx',
      'forgot-password.tsx',
      'settings/settings.tsx',
      'user/user-button.tsx',
    ];

    for (const file of required) {
      const contents = readFileSync(path.join(authDir, file), 'utf8');
      expect(contents.length).toBeGreaterThan(0);
      expect(contents).toMatch(/SPDX-License-Identifier:\s*MIT/);
    }
  });
});
