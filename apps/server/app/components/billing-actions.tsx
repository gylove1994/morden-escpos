/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import { useState } from 'react';

type CheckoutPlan = 'personal' | 'business';

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json() as T & { error?: string, message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? `Request failed (${response.status})`);
  }
  return data;
}

export function BillingActions({
  resellerContactUrl,
  canManageBilling,
  hasStripeCustomer,
}: {
  resellerContactUrl: string
  canManageBilling: boolean
  hasStripeCustomer: boolean
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function startCheckout(plan: CheckoutPlan) {
    setError(null);
    setPending(plan);
    try {
      const result = await postJson<{ url: string }>('/api/billing/checkout', { plan });
      window.location.assign(result.url);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setPending(null);
    }
  }

  async function openPortal() {
    setError(null);
    setPending('portal');
    try {
      const result = await postJson<{ url: string }>('/api/billing/portal', {});
      window.location.assign(result.url);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Portal failed');
      setPending(null);
    }
  }

  if (!canManageBilling) {
    return (
      <p className="muted">
        Only Organization owners and admins can change billing.
      </p>
    );
  }

  return (
    <div className="stack">
      <div className="row" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void startCheckout('personal')}
        >
          {pending === 'personal' ? 'Redirecting…' : 'Checkout Personal (~$1/mo)'}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void startCheckout('business')}
        >
          {pending === 'business' ? 'Redirecting…' : 'Checkout Business (~$5+/mo)'}
        </button>
        <button
          type="button"
          disabled={pending !== null || !hasStripeCustomer}
          onClick={() => void openPortal()}
        >
          {pending === 'portal' ? 'Redirecting…' : 'Manage in Customer Portal'}
        </button>
        <a className="button-link" href={resellerContactUrl}>
          Contact for Reseller
        </a>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <p className="muted">
        Reseller is contact-only — there is no self-serve Checkout for that path.
      </p>
    </div>
  );
}
