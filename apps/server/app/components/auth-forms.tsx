/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '../../lib/auth-client';
import { useConsoleI18n } from '../../lib/i18n/client';

export function SignUpForm() {
  const router = useRouter();
  const { messages } = useConsoleI18n();
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
      setError(signUpError.message ?? messages.auth.signUpFailed);
      return;
    }

    router.push('/console');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        {messages.auth.name}
        <input name="name" autoComplete="name" required minLength={1} />
      </label>
      <label>
        {messages.auth.email}
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        {messages.auth.password}
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
        {pending ? messages.auth.creatingAccount : messages.auth.signUp}
      </button>
    </form>
  );
}

export function SignInForm() {
  const router = useRouter();
  const { messages } = useConsoleI18n();
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
      setError(signInError.message ?? messages.auth.signInFailed);
      return;
    }

    router.push('/console');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        {messages.auth.email}
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        {messages.auth.password}
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
        {pending ? messages.auth.signingIn : messages.auth.signIn}
      </button>
    </form>
  );
}

export function CreateOrganizationForm() {
  const router = useRouter();
  const { messages } = useConsoleI18n();
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
      setError(createError.message ?? messages.createOrg.failed);
      return;
    }

    router.push('/console');
    router.refresh();
  }

  return (
    <form className="org-form" onSubmit={onSubmit}>
      <label>
        {messages.createOrg.nameLabel}
        <input
          name="name"
          required
          minLength={2}
          placeholder={messages.createOrg.namePlaceholder}
        />
      </label>
      <label>
        {messages.createOrg.slugLabel}
        <input
          name="slug"
          required
          minLength={2}
          placeholder={messages.createOrg.slugPlaceholder}
          pattern="[a-z0-9-]+"
        />
      </label>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? messages.createOrg.creating : messages.createOrg.submit}
      </button>
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const { messages } = useConsoleI18n();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button type="button" className="secondary" disabled={pending} onClick={onClick}>
      {pending ? messages.shell.signingOut : messages.shell.signOut}
    </button>
  );
}
