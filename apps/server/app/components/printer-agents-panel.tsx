/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export type PrinterAgentListItem = {
  id: string
  name: string
  status: 'active' | 'revoked'
  deviceTokenPrefix: string | null
  createdAt: string
  revokedAt: string | null
};

type Props = {
  initialPrinterAgents: PrinterAgentListItem[]
  canManage: boolean
};

export function PrinterAgentsPanel({ initialPrinterAgents, canManage }: Props) {
  const router = useRouter();
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
    if (!canManage) return;
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
      setError(body.message ?? 'Could not create Printer Agent');
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
    if (!canManage) return;
    setActionId(printerAgentId);
    setError(null);
    const response = await fetch(
      `/api/console/printer-agents/${printerAgentId}/revoke`,
      { method: 'POST' },
    );
    setActionId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not revoke device token');
      return;
    }
    if (revealedToken?.printerAgentId === printerAgentId) {
      setRevealedToken(null);
    }
    await refreshList();
  }

  async function onRotate(printerAgentId: string, agentName: string) {
    if (!canManage) return;
    setActionId(printerAgentId);
    setError(null);
    const response = await fetch(
      `/api/console/printer-agents/${printerAgentId}/rotate`,
      { method: 'POST' },
    );
    setActionId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not rotate device token');
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
                Device token
                {' '}
                {revealedToken.reason === 'created' ? 'created' : 'rotated'}
              </h2>
              <p>
                Copy the token for
                {' '}
                <strong>{revealedToken.name}</strong>
                {' '}
                now. It will not be shown again.
              </p>
              <code className="token-value">{revealedToken.deviceToken}</code>
              <button
                type="button"
                className="secondary"
                onClick={() => setRevealedToken(null)}
              >
                Dismiss
              </button>
            </div>
          )
        : null}

      {canManage
        ? (
            <form className="org-form" onSubmit={onCreate}>
              <label>
                Printer Agent name
                <input
                  name="name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  required
                  minLength={1}
                  maxLength={120}
                  placeholder="Store front desk"
                />
              </label>
              {error ? <p className="error" role="alert">{error}</p> : null}
              <button type="submit" disabled={pending || name.trim().length === 0}>
                {pending ? 'Creating…' : 'Create Printer Agent'}
              </button>
            </form>
          )
        : (
            <p className="muted">
              Viewing only. owner or admin can create, revoke, or rotate device tokens.
            </p>
          )}

      {!canManage && error ? <p className="error" role="alert">{error}</p> : null}

      <div className="stack">
        <h2>Registered Printer Agents</h2>
        {printerAgents.length === 0
          ? <p className="muted">No Printer Agents yet. Create one to receive a device token.</p>
          : (
              <ul className="agent-list">
                {printerAgents.map(agent => (
                  <li key={agent.id} className="agent-row">
                    <div>
                      <div className="agent-name">{agent.name}</div>
                      <div className="muted agent-meta">
                        <span>
                          Status:
                          {' '}
                          {agent.status}
                        </span>
                        <span>
                          Token:
                          {' '}
                          {agent.deviceTokenPrefix ? `${agent.deviceTokenPrefix}…` : 'none'}
                        </span>
                        <span className="agent-id">
                          printerAgentId:
                          {' '}
                          {agent.id}
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
                              Rotate token
                            </button>
                            <button
                              type="button"
                              className="danger"
                              disabled={actionId === agent.id || agent.status === 'revoked'}
                              onClick={() => onRevoke(agent.id)}
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
      </div>
    </div>
  );
}
