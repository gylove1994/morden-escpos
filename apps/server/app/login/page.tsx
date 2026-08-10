/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { getConsoleSession } from '../../lib/console-auth';
import { getConsoleAuthLocalization, getConsoleLocale } from '../../lib/console-locale';
import { AuthShell } from '../components/auth-shell';

export default async function LoginPage() {
  const session = await getConsoleSession();
  if (session) {
    redirect('/console');
  }

  const locale = await getConsoleLocale();
  const localization = await getConsoleAuthLocalization();
  const switchLocale = locale === 'en' ? 'zh' : 'en';

  return (
    <AuthShell view="signIn" shell="login" localization={localization}>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <a
          href={`/api/console/locale?locale=${switchLocale}&next=/login`}
          className="underline underline-offset-4"
        >
          {locale === 'en' ? '中文' : 'English'}
        </a>
      </p>
    </AuthShell>
  );
}
