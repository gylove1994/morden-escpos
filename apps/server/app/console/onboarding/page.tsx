/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { requireConsoleOnboarding } from '../../../lib/console-guards';
import { CreateOrganizationForm } from '../../components/auth-forms';

export default async function OnboardingPage() {
  await requireConsoleOnboarding();

  return (
    <section data-shell="onboarding" className="stack">
      <h1>Create your Organization</h1>
      <p className="muted">
        You become the Organization owner. Business and Platform surfaces stay
        unavailable until an Organization is active.
      </p>
      <CreateOrganizationForm />
    </section>
  );
}
