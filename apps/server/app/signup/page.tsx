/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { SignUpForm } from '../components/auth-forms';
import { getConsoleSession } from '../../lib/console-auth';

export default async function SignUpPage() {
  const session = await getConsoleSession();
  if (session) {
    redirect('/console');
  }

  return (
    <main className="auth-panel">
      <h1>Create your account</h1>
      <p className="muted">Email/password signup via Better Auth (human session).</p>
      <SignUpForm />
      <p className="muted">
        Already have an account?
        {' '}
        <a href="/login">Sign in</a>
      </p>
    </main>
  );
}
