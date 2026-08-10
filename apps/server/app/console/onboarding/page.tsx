/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { requireConsoleOnboarding } from '../../../lib/console-guards';
import { CreateOrganizationForm } from '../../components/auth-forms';

export default async function OnboardingPage() {
  await requireConsoleOnboarding();

  return (
    <section data-shell="onboarding" className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your Organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You become the Organization owner. Business and Platform surfaces stay
          unavailable until an Organization is active.
        </p>
      </div>
      <CreateOrganizationForm />
    </section>
  );
}
