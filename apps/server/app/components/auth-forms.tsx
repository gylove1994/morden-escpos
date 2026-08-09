/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { authClient } from '../../lib/auth-client';

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setPending(false);
    if (signUpError) {
      setError(signUpError.message ?? 'Sign up failed');
      return;
    }

    router.push('/console');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        Name
        <input name="name" autoComplete="name" required minLength={1} />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </label>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Sign up'}
      </button>
    </form>
  );
}

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    setPending(false);
    if (signInError) {
      setError(signInError.message ?? 'Sign in failed');
      return;
    }

    router.push('/console');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </label>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export function CreateOrganizationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const slug = String(form.get('slug') ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { error: createError } = await authClient.organization.create({
      name,
      slug,
    });

    setPending(false);
    if (createError) {
      setError(createError.message ?? 'Could not create Organization');
      return;
    }

    router.push('/console');
    router.refresh();
  }

  return (
    <form className="org-form" onSubmit={onSubmit}>
      <label>
        Organization name
        <input name="name" required minLength={2} placeholder="Acme Prints" />
      </label>
      <label>
        Slug
        <input name="slug" required minLength={2} placeholder="acme-prints" pattern="[a-z0-9-]+" />
      </label>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create Organization'}
      </button>
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button type="button" className="secondary" disabled={pending} onClick={onClick}>
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
