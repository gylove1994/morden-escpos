/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { redirect } from 'next/navigation';
import { IntegratorAuthPanel } from '../../components/integrator-auth-panel';
import {
  canManageIntegratorAuth,
  getConsoleSession,
} from '../../../lib/console-auth';
import { listIntegratorApiKeys } from '../../../lib/integrator-api-key';
import { listWebhookSigningSecrets } from '../../../lib/webhook-secret';

export default async function IntegratorAuthPage() {
  const session = await getConsoleSession();
  if (!session) {
    redirect('/login');
  }

  if (!session.organization) {
    redirect('/console/create-organization');
  }

  const [apiKeys, webhookSecrets] = await Promise.all([
    listIntegratorApiKeys(session.organization.id),
    listWebhookSigningSecrets(session.organization.id),
  ]);

  return (
    <section className="stack">
      <h1>Integrator auth</h1>
      <p className="muted">
        Create API keys and webhook signing secrets for business-system enqueue.
        These credentials are separate from Printer Agent device tokens and human
        session cookies — they cannot authenticate the Print Queue Agent Protocol.
      </p>
      <IntegratorAuthPanel
        initialApiKeys={apiKeys}
        initialWebhookSecrets={webhookSecrets}
        canManage={canManageIntegratorAuth(session.role)}
      />
    </section>
  );
}
