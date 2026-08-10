/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import type { AuthMessages } from '@workspace/ui/lib/auth-i18n';

/**
 * Console locale catalog overlays for Better Auth UI (email/password shells).
 * Production source of truth for en/zh auth copy in the SaaS console.
 */
export const consoleAuthMessages = {
  en: {
    auth: {
      signIn: 'Sign in',
      signUp: 'Create account',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: 'Password',
      name: 'Name',
      namePlaceholder: 'Name',
      confirmPassword: 'Confirm password',
      confirmPasswordPlaceholder: 'Confirm your password',
      alreadyHaveAnAccount: 'Already have an account?',
      needToCreateAnAccount: 'Need to create an account?',
      fieldRequired: 'This field is required',
      invalidEmail: 'Please enter a valid email address',
      passwordsDoNotMatch: 'Passwords do not match',
      hidePassword: 'Hide password',
      showPassword: 'Show password',
      rememberMe: 'Remember me',
    },
  },
  zh: {
    auth: {
      signIn: '登录',
      signUp: '创建账户',
      email: '邮箱',
      emailPlaceholder: 'you@example.com',
      password: '密码',
      passwordPlaceholder: '密码',
      name: '姓名',
      namePlaceholder: '姓名',
      confirmPassword: '确认密码',
      confirmPasswordPlaceholder: '再次输入密码',
      alreadyHaveAnAccount: '已有账户？',
      needToCreateAnAccount: '需要创建账户？',
      fieldRequired: '此字段必填',
      invalidEmail: '请输入有效的邮箱地址',
      passwordsDoNotMatch: '两次输入的密码不一致',
      hidePassword: '隐藏密码',
      showPassword: '显示密码',
      rememberMe: '记住我',
    },
  },
} as const satisfies Record<'en' | 'zh', AuthMessages>;
