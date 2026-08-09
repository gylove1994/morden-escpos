/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { SignUpForm } from '../components/auth-forms';
import { LocaleSwitcher } from '../components/locale-switcher';
import { getConsoleSession } from '../../lib/console-auth';
import { getConsoleMessages } from '../../lib/i18n/server';

export default async function SignUpPage() {
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
      <h1>{messages.auth.signUpTitle}</h1>
      <SignUpForm />
      <p className="muted">
        <a href="/login">{messages.auth.haveAccount}</a>
      </p>
    </main>
  );
}
