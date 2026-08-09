/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../lib/console-auth';
import { EDITION } from '../lib/edition';

export default async function HomePage() {
  const session = await getConsoleSession();
  if (session) {
    redirect('/console');
  }

  return (
    <main className="auth-panel">
      <h1>morden-escpos</h1>
      <p className="muted">
        Print-queue control plane (
        {EDITION}
        {' '}
        edition). Sign in to open your Organization console.
      </p>
      <p>
        <a className="button" href="/signup">Sign up</a>
        {' '}
        <a className="button secondary" href="/login">Sign in</a>
      </p>
    </main>
  );
}
