/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { FormEvent } from 'react';
import { Alert, AlertDescription } from '@workspace/ui/components/ui/alert';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/ui/card';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '../../lib/auth-client';

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
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Organization details</CardTitle>
        <CardDescription>
          You become the Organization owner after create.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              name="name"
              required
              minLength={2}
              placeholder="Acme Prints"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              name="slug"
              required
              minLength={2}
              placeholder="acme-prints"
              pattern="[a-z0-9-]+"
            />
          </div>
          {error
            ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )
            : null}
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create Organization'}
          </Button>
        </form>
      </CardContent>
    </Card>
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
    <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={onClick}>
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
