/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../../lib/console-auth';
import { getConsoleMessages } from '../../lib/i18n/server';
import { SignInForm } from '../components/auth-forms';
import { LocaleSwitcher } from '../components/locale-switcher';

export default async function LoginPage() {
  const session = await getConsoleSession();
  if (session) {
    redirect('/console');
  }

  const { messages } = await getConsoleMessages();

  return (
    <main className="auth-panel">
      <div className="auth-toolbar">
        <LocaleSwitcher />
      </div>
      <h1>{messages.auth.signInTitle}</h1>
      <SignInForm />
      <p className="muted">
        <a href="/signup">{messages.auth.needAccount}</a>
      </p>
    </main>
  );
}
