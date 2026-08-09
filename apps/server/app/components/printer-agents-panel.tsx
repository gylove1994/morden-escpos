/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useConsoleI18n } from '../../lib/i18n/client';

export interface PrinterAgentListItem {
  id: string
  name: string
  status: 'active' | 'revoked'
  presence: 'online' | 'offline'
  deviceTokenPrefix: string | null
  createdAt: string
  revokedAt: string | null
  lastAuthenticatedAt: string | null
}

interface Props {
  initialPrinterAgents: PrinterAgentListItem[]
  canManage: boolean
}

export function PrinterAgentsPanel({ initialPrinterAgents, canManage }: Props) {
  const router = useRouter();
  const { messages, locale } = useConsoleI18n();
  const [printerAgents, setPrinterAgents] = useState(initialPrinterAgents);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [revealedToken, setRevealedToken] = useState<{
    printerAgentId: string
    name: string
    deviceToken: string
    reason: 'created' | 'rotated'
  } | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  async function refreshList() {
    const response = await fetch('/api/console/printer-agents');
    if (!response.ok) {
      return;
    }
    const body = await response.json() as { printerAgents: PrinterAgentListItem[] };
    setPrinterAgents(body.printerAgents);
    router.refresh();
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage)
      return;
    setPending(true);
    setError(null);
    setRevealedToken(null);

    const response = await fetch('/api/console/printer-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? messages.printerAgents.createFailed);
      return;
    }

    const body = await response.json() as {
      printerAgent: PrinterAgentListItem
      deviceToken: string
    };
    setName('');
    setRevealedToken({
      printerAgentId: body.printerAgent.id,
      name: body.printerAgent.name,
      deviceToken: body.deviceToken,
      reason: 'created',
    });
    await refreshList();
  }

  async function onRevoke(printerAgentId: string) {
    if (!canManage)
      return;
    setActionId(printerAgentId);
    setError(null);
    const response = await fetch(
      `/api/console/printer-agents/${printerAgentId}/revoke`,
      { method: 'POST' },
    );
    setActionId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? messages.printerAgents.createFailed);
      return;
    }
    if (revealedToken?.printerAgentId === printerAgentId) {
      setRevealedToken(null);
    }
    await refreshList();
  }

  async function onRotate(printerAgentId: string, agentName: string) {
    if (!canManage)
      return;
    setActionId(printerAgentId);
    setError(null);
    const response = await fetch(
      `/api/console/printer-agents/${printerAgentId}/rotate`,
      { method: 'POST' },
    );
    setActionId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? messages.printerAgents.createFailed);
      return;
    }
    const body = await response.json() as {
      printerAgent: PrinterAgentListItem
      deviceToken: string
    };
    setRevealedToken({
      printerAgentId: body.printerAgent.id,
      name: agentName,
      deviceToken: body.deviceToken,
      reason: 'rotated',
    });
    await refreshList();
  }

  return (
    <div className="stack">
      {revealedToken
        ? (
            <div className="token-reveal" role="status">
              <h2>
                {revealedToken.reason === 'created'
                  ? messages.printerAgents.tokenCreated
                  : messages.printerAgents.tokenRotated}
              </h2>
              <p>
                {messages.printerAgents.copyHint}
                {' '}
                <strong>{revealedToken.name}</strong>
              </p>
              <code className="token-value">{revealedToken.deviceToken}</code>
              <button
                type="button"
                className="secondary"
                onClick={() => setRevealedToken(null)}
              >
                OK
              </button>
            </div>
          )
        : null}

      {canManage
        ? (
            <form className="org-form" onSubmit={onCreate}>
              <label>
                {messages.printerAgents.nameLabel}
                <input
                  name="name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  required
                  minLength={1}
                  maxLength={120}
                />
              </label>
              {error ? <p className="error" role="alert">{error}</p> : null}
              <button type="submit" disabled={pending || name.trim().length === 0}>
                {pending ? messages.printerAgents.creating : messages.printerAgents.create}
              </button>
            </form>
          )
        : (
            <p className="muted">{messages.printerAgents.membersReadOnly}</p>
          )}

      {!canManage && error ? <p className="error" role="alert">{error}</p> : null}

      <div className="stack">
        <div className="agent-actions">
          <h2>{messages.printerAgents.title}</h2>
          <button type="button" className="secondary" onClick={() => void refreshList()}>
            {messages.printerAgents.refresh}
          </button>
        </div>
        {printerAgents.length === 0
          ? <p className="muted">{messages.printerAgents.empty}</p>
          : (
              <ul className="agent-list">
                {printerAgents.map(agent => (
                  <li key={agent.id} className="agent-row">
                    <div>
                      <div className="agent-name">{agent.name}</div>
                      <div className="muted agent-meta">
                        <span>
                          {agent.status === 'active'
                            ? messages.printerAgents.statusActive
                            : messages.printerAgents.statusRevoked}
                        </span>
                        <span>
                          {messages.printerAgents.tokenPrefix}
                          :
                          {' '}
                          {agent.deviceTokenPrefix ? `${agent.deviceTokenPrefix}…` : '—'}
                        </span>
                        <span>
                          {messages.printerAgents.presence}
                          :
                          {' '}
                          {agent.presence ?? '—'}
                        </span>
                        <span>
                          {messages.printerAgents.lastSeen}
                          :
                          {' '}
                          {agent.lastAuthenticatedAt
                            ? new Date(agent.lastAuthenticatedAt).toLocaleString(locale)
                            : messages.printerAgents.never}
                        </span>
                        <span className="agent-id">
                          printerAgentId:
                          {' '}
                          {agent.id}
                        </span>
                        <span>
                          {messages.printerAgents.created}
                          :
                          {' '}
                          {new Date(agent.createdAt).toLocaleString(locale)}
                        </span>
                      </div>
                    </div>
                    {canManage
                      ? (
                          <div className="agent-actions">
                            <button
                              type="button"
                              className="secondary"
                              disabled={actionId === agent.id}
                              onClick={() => onRotate(agent.id, agent.name)}
                            >
                              {messages.printerAgents.rotate}
                            </button>
                            <button
                              type="button"
                              className="danger"
                              disabled={actionId === agent.id || agent.status === 'revoked'}
                              onClick={() => onRevoke(agent.id)}
                            >
                              {messages.printerAgents.revoke}
                            </button>
                          </div>
                        )
                      : null}
                  </li>
                ))}
              </ul>
            )}
      </div>
    </div>
  );
}
