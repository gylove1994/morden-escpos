/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { AuthMessages } from '@workspace/ui/lib/auth-i18n';
import type { ComponentProps, ReactNode } from 'react';
import { Auth } from '@workspace/ui/components/auth/auth';
import { AuthProvider } from '@workspace/ui/components/auth/auth-provider';
import { createAuthLocalization } from '@workspace/ui/lib/auth-i18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '../../lib/auth-client';

function ConsoleAuthLink({
  href,
  children,
  className,
  ...props
}: ComponentProps<'a'> & { href: string }) {
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}

export function AuthShell({
  view,
  localization,
  shell,
  children,
}: {
  view: 'signIn' | 'signUp'
  localization: AuthMessages
  shell: 'login' | 'signup'
  children?: ReactNode
}) {
  const router = useRouter();

  return (
    <main
      data-shell={shell === 'login' ? 'login' : 'signup'}
      className="mx-auto mt-16 w-[min(28rem,calc(100%-2rem))] pb-12"
    >
      <AuthProvider
        authClient={authClient}
        redirectTo="/console"
        navigate={({ to, replace }) => {
          if (replace) {
            router.replace(to);
          }
          else {
            router.push(to);
          }
          router.refresh();
        }}
        Link={ConsoleAuthLink}
        socialProviders={[]}
        emailAndPassword={{
          enabled: true,
          forgotPassword: false,
          requireEmailVerification: false,
          confirmPassword: true,
        }}
        basePaths={{
          auth: '',
          settings: '/settings',
          organization: '/organization',
        }}
        viewPaths={{
          auth: {
            signIn: 'login',
            signUp: 'signup',
          },
        }}
        localization={createAuthLocalization(localization)}
      >
        <Auth view={view} />
        {children}
      </AuthProvider>
    </main>
  );
}
