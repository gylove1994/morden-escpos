/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export type ApiKeyListItem = {
  id: string
  name: string
  status: 'active' | 'revoked'
  keyPrefix: string | null
  createdAt: string
  revokedAt: string | null
};

export type WebhookSecretListItem = {
  id: string
  name: string
  status: 'active' | 'revoked'
  secretPrefix: string | null
  createdAt: string
  revokedAt: string | null
};

type Props = {
  initialApiKeys: ApiKeyListItem[]
  initialWebhookSecrets: WebhookSecretListItem[]
  canManage: boolean
};

export function IntegratorAuthPanel({
  initialApiKeys,
  initialWebhookSecrets,
  canManage,
}: Props) {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [webhookSecrets, setWebhookSecrets] = useState(initialWebhookSecrets);
  const [apiKeyName, setApiKeyName] = useState('');
  const [webhookName, setWebhookName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<'api' | 'webhook' | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [revealedApiKey, setRevealedApiKey] = useState<{
    id: string
    name: string
    token: string
  } | null>(null);
  const [revealedWebhookSecret, setRevealedWebhookSecret] = useState<{
    id: string
    name: string
    secret: string
  } | null>(null);

  async function refreshLists() {
    const [apiRes, webhookRes] = await Promise.all([
      fetch('/api/console/api-keys'),
      fetch('/api/console/webhook-secrets'),
    ]);
    if (apiRes.ok) {
      const body = await apiRes.json() as { apiKeys: ApiKeyListItem[] };
      setApiKeys(body.apiKeys);
    }
    if (webhookRes.ok) {
      const body = await webhookRes.json() as { webhookSecrets: WebhookSecretListItem[] };
      setWebhookSecrets(body.webhookSecrets);
    }
    router.refresh();
  }

  async function onCreateApiKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    setPending('api');
    setError(null);
    setRevealedApiKey(null);

    const response = await fetch('/api/console/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: apiKeyName }),
    });

    setPending(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not create integrator API key');
      return;
    }

    const body = await response.json() as {
      apiKey: ApiKeyListItem
      token: string
    };
    setApiKeyName('');
    setRevealedApiKey({
      id: body.apiKey.id,
      name: body.apiKey.name,
      token: body.token,
    });
    await refreshLists();
  }

  async function onRevokeApiKey(apiKeyId: string) {
    if (!canManage) return;
    setActionId(apiKeyId);
    setError(null);
    const response = await fetch(`/api/console/api-keys/${apiKeyId}/revoke`, {
      method: 'POST',
    });
    setActionId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not revoke integrator API key');
      return;
    }
    if (revealedApiKey?.id === apiKeyId) {
      setRevealedApiKey(null);
    }
    await refreshLists();
  }

  async function onCreateWebhookSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    setPending('webhook');
    setError(null);
    setRevealedWebhookSecret(null);

    const response = await fetch('/api/console/webhook-secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: webhookName }),
    });

    setPending(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not create webhook signing secret');
      return;
    }

    const body = await response.json() as {
      webhookSecret: WebhookSecretListItem
      secret: string
    };
    setWebhookName('');
    setRevealedWebhookSecret({
      id: body.webhookSecret.id,
      name: body.webhookSecret.name,
      secret: body.secret,
    });
    await refreshLists();
  }

  async function onRevokeWebhookSecret(webhookSecretId: string) {
    if (!canManage) return;
    setActionId(webhookSecretId);
    setError(null);
    const response = await fetch(
      `/api/console/webhook-secrets/${webhookSecretId}/revoke`,
      { method: 'POST' },
    );
    setActionId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not revoke webhook signing secret');
      return;
    }
    if (revealedWebhookSecret?.id === webhookSecretId) {
      setRevealedWebhookSecret(null);
    }
    await refreshLists();
  }

  return (
    <div className="stack">
      {revealedApiKey
        ? (
            <div className="token-reveal" role="status">
              <h2>Integrator API key created</h2>
              <p>
                Copy the key for
                {' '}
                <strong>{revealedApiKey.name}</strong>
                {' '}
                now. It will not be shown again. Use
                {' '}
                <code>Authorization: Bearer …</code>
                {' '}
                on
                {' '}
                <code>POST /api/integrator/v1/jobs</code>
                .
              </p>
              <code className="token-value">{revealedApiKey.token}</code>
              <button
                type="button"
                className="secondary"
                onClick={() => setRevealedApiKey(null)}
              >
                Dismiss
              </button>
            </div>
          )
        : null}

      {revealedWebhookSecret
        ? (
            <div className="token-reveal" role="status">
              <h2>Webhook signing secret created</h2>
              <p>
                Copy the secret for
                {' '}
                <strong>{revealedWebhookSecret.name}</strong>
                {' '}
                now. It will not be shown again. Authenticate
                {' '}
                <code>POST /api/webhooks/v1/jobs</code>
                {' '}
                with
                {' '}
                <code>X-Webhook-Secret</code>
                {' '}
                or HMAC
                {' '}
                <code>X-Webhook-Signature</code>
                {' '}
                (webhook id:
                {' '}
                <code>{revealedWebhookSecret.id}</code>
                ).
              </p>
              <code className="token-value">{revealedWebhookSecret.secret}</code>
              <button
                type="button"
                className="secondary"
                onClick={() => setRevealedWebhookSecret(null)}
              >
                Dismiss
              </button>
            </div>
          )
        : null}

      {error ? <p className="error" role="alert">{error}</p> : null}

      {!canManage
        ? (
            <p className="muted">
              Viewing only. owner or admin can create or revoke integrator credentials.
            </p>
          )
        : null}

      <section className="stack">
        <h2>API keys</h2>
        {canManage
          ? (
              <form className="org-form" onSubmit={onCreateApiKey}>
                <label>
                  API key name
                  <input
                    name="apiKeyName"
                    value={apiKeyName}
                    onChange={event => setApiKeyName(event.target.value)}
                    required
                    minLength={1}
                    maxLength={120}
                    placeholder="POS integrator"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending !== null || apiKeyName.trim().length === 0}
                >
                  {pending === 'api' ? 'Creating…' : 'Create API key'}
                </button>
              </form>
            )
          : null}

        {apiKeys.length === 0
          ? <p className="muted">No integrator API keys yet.</p>
          : (
              <ul className="agent-list">
                {apiKeys.map(key => (
                  <li key={key.id} className="agent-row">
                    <div>
                      <div className="agent-name">{key.name}</div>
                      <div className="muted agent-meta">
                        <span>
                          Status:
                          {' '}
                          {key.status}
                        </span>
                        <span>
                          Key:
                          {' '}
                          {key.keyPrefix ? `${key.keyPrefix}…` : 'none'}
                        </span>
                        <span className="agent-id">
                          apiKeyId:
                          {' '}
                          {key.id}
                        </span>
                      </div>
                    </div>
                    {canManage
                      ? (
                          <div className="agent-actions">
                            <button
                              type="button"
                              className="danger"
                              disabled={actionId === key.id || key.status === 'revoked'}
                              onClick={() => onRevokeApiKey(key.id)}
                            >
                              Revoke
                            </button>
                          </div>
                        )
                      : null}
                  </li>
                ))}
              </ul>
            )}
      </section>

      <section className="stack">
        <h2>Webhook signing secrets</h2>
        {canManage
          ? (
              <form className="org-form" onSubmit={onCreateWebhookSecret}>
                <label>
                  Webhook secret name
                  <input
                    name="webhookName"
                    value={webhookName}
                    onChange={event => setWebhookName(event.target.value)}
                    required
                    minLength={1}
                    maxLength={120}
                    placeholder="Order webhook"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending !== null || webhookName.trim().length === 0}
                >
                  {pending === 'webhook' ? 'Creating…' : 'Create webhook secret'}
                </button>
              </form>
            )
          : null}

        {webhookSecrets.length === 0
          ? <p className="muted">No webhook signing secrets yet.</p>
          : (
              <ul className="agent-list">
                {webhookSecrets.map(secret => (
                  <li key={secret.id} className="agent-row">
                    <div>
                      <div className="agent-name">{secret.name}</div>
                      <div className="muted agent-meta">
                        <span>
                          Status:
                          {' '}
                          {secret.status}
                        </span>
                        <span>
                          Secret:
                          {' '}
                          {secret.secretPrefix ? `${secret.secretPrefix}…` : 'none'}
                        </span>
                        <span className="agent-id">
                          webhookSecretId:
                          {' '}
                          {secret.id}
                        </span>
                      </div>
                    </div>
                    {canManage
                      ? (
                          <div className="agent-actions">
                            <button
                              type="button"
                              className="danger"
                              disabled={
                                actionId === secret.id || secret.status === 'revoked'
                              }
                              onClick={() => onRevokeWebhookSecret(secret.id)}
                            >
                              Revoke
                            </button>
                          </div>
                        )
                      : null}
                  </li>
                ))}
              </ul>
            )}
      </section>
    </div>
  );
}
