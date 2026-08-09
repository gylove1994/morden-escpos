/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../lib/console-auth';
import { EDITION } from '../lib/edition';
import { getConsoleMessages } from '../lib/i18n/server';
import { LocaleSwitcher } from './components/locale-switcher';

export default async function HomePage() {
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
      <h1>{messages.brand}</h1>
      <p className="muted">
        {EDITION}
        {' · '}
        {messages.auth.needAccount}
      </p>
      <p>
        <a className="button" href="/signup">{messages.auth.signUp}</a>
        {' '}
        <a className="button secondary" href="/login">{messages.auth.signIn}</a>
      </p>
    </main>
  );
}
