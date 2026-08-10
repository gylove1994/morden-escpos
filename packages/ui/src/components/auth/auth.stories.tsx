/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createAuthClient } from 'better-auth/react';
import type { ComponentProps } from 'react';

import { Auth } from '#components/auth/auth';
import { AuthProvider } from '#components/auth/auth-provider';
import { createAuthLocalization, type AuthMessages } from '#lib/auth-i18n';

/**
 * Story-only demo catalogs. Production en/zh copy MUST come from the SaaS
 * console locale catalogs via `createAuthLocalization`.
 */
const storyMessages = {
  en: {
    auth: {
      signIn: 'Sign in',
      signUp: 'Create account',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      alreadyHaveAnAccount: 'Already have an account?',
      needToCreateAnAccount: 'Need to create an account?',
      forgotPasswordLink: 'Forgot password?',
    },
  },
  zh: {
    auth: {
      signIn: '登录',
      signUp: '创建账户',
      email: '邮箱',
      password: '密码',
      name: '姓名',
      alreadyHaveAnAccount: '已有账户？',
      needToCreateAnAccount: '需要创建账户？',
      forgotPasswordLink: '忘记密码？',
    },
  },
} as const satisfies Record<'en' | 'zh', AuthMessages>;

const storyAuthClient = createAuthClient({
  baseURL: 'http://localhost:6006',
});

function StoryLink({
  href,
  children,
  ...props
}: ComponentProps<'a'> & { href: string }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

type AuthStoryArgs = {
  locale: 'en' | 'zh';
  view: 'signIn' | 'signUp';
};

/**
 * Better Auth UI sign-in / sign-up surfaces with injectable en/zh messages.
 */
const meta = {
  title: 'ui/patterns/Auth',
  component: Auth,
  tags: ['autodocs'],
  argTypes: {
    locale: {
      control: 'select',
      options: ['en', 'zh'],
    },
    view: {
      control: 'select',
      options: ['signIn', 'signUp'],
    },
  },
  args: {
    locale: 'en',
    view: 'signIn',
  },
  parameters: {
    layout: 'centered',
  },
  render: ({ locale, view }) => (
    <AuthProvider
      authClient={storyAuthClient}
      navigate={() => undefined}
      Link={StoryLink}
      emailAndPassword={{ enabled: true, requireEmailVerification: false }}
      localization={createAuthLocalization(storyMessages[locale])}
    >
      <div className="w-[min(100vw-2rem,24rem)]">
        <Auth view={view} />
      </div>
    </AuthProvider>
  ),
} satisfies Meta<AuthStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * English sign-in shell with injected demo messages.
 */
export const SignInEnglish: Story = {
  args: {
    locale: 'en',
    view: 'signIn',
  },
};

/**
 * Chinese sign-in shell with injected demo messages.
 */
export const SignInChinese: Story = {
  args: {
    locale: 'zh',
    view: 'signIn',
  },
};

/**
 * English sign-up shell with injected demo messages.
 */
export const SignUpEnglish: Story = {
  args: {
    locale: 'en',
    view: 'signUp',
  },
};

/**
 * Chinese sign-up shell with injected demo messages.
 */
export const SignUpChinese: Story = {
  args: {
    locale: 'zh',
    view: 'signUp',
  },
};
