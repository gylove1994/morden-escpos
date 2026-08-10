/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { Button } from '@workspace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/ui/card';
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../lib/console-auth';
import { EDITION } from '../lib/edition';

export default async function HomePage() {
  const session = await getConsoleSession();
  if (session) {
    redirect('/console');
  }

  return (
    <main className="mx-auto mt-16 w-[min(28rem,calc(100%-2rem))] pb-12">
      <Card>
        <CardHeader>
          <CardTitle>morden-escpos</CardTitle>
          <CardDescription>
            Print-queue control plane (
            {EDITION}
            {' '}
            edition). Sign in to open your Organization console.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <a href="/signup">Sign up</a>
          </Button>
          <Button asChild variant="secondary">
            <a href="/login">Sign in</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
