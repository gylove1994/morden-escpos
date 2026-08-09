/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { SignInForm } from '../components/auth-forms';
import { getConsoleSession } from '../../lib/console-auth';

export default async function LoginPage() {
  const session = await getConsoleSession();
  if (session) {
    redirect('/console');
  }

  return (
    <main className="auth-panel">
      <h1>Sign in</h1>
      <p className="muted">Human session auth — separate from Printer Agent device tokens.</p>
      <SignInForm />
      <p className="muted">
        New here?
        {' '}
        <a href="/signup">Create an account</a>
      </p>
    </main>
  );
}
