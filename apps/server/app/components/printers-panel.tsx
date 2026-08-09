/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useConsoleI18n } from '../../lib/i18n/client';

export interface PrinterListItem {
  id: string
  printerAgentId: string
  printerAgentName: string
  printerAgentPresence: 'online' | 'offline'
  printerAgentLastAuthenticatedAt: string | null
  name: string
  status: 'active' | 'disabled'
  connectionHints: {
    transport: 'tcp' | 'usb' | 'serial'
    address?: string
    port?: number
    path?: string
    baudRate?: number
  }
  createdAt: string
}

export interface PrinterAgentOption {
  id: string
  name: string
  status: string
  presence?: 'online' | 'offline'
}

export interface DiscoveryListItem {
  id: string
  printerAgentId: string
  endpointKey: string
  suggestedName: string | null
  connectionHints: PrinterListItem['connectionHints']
  lastSeenAt: string
  confirmedPrinterId: string | null
}

interface Props {
  initialPrinters: PrinterListItem[]
  initialDiscoveries: DiscoveryListItem[]
  printerAgents: PrinterAgentOption[]
  canManage: boolean
}

function formatHints(hints: PrinterListItem['connectionHints']): string {
  if (hints.transport === 'tcp') {
    return `tcp://${hints.address}:${hints.port}`;
  }
  if (hints.transport === 'serial') {
    return hints.baudRate
      ? `serial://${hints.path} @ ${hints.baudRate}`
      : `serial://${hints.path}`;
  }
  return `usb://${hints.path}`;
}

function agentLabel(
  printerAgents: PrinterAgentOption[],
  printerAgentId: string,
): string {
  return printerAgents.find(agent => agent.id === printerAgentId)?.name
    ?? printerAgentId;
}

export function PrintersPanel({
  initialPrinters,
  initialDiscoveries,
  printerAgents,
  canManage,
}: Props) {
  const router = useRouter();
  const { messages } = useConsoleI18n();
  const [printers, setPrinters] = useState(initialPrinters);
  const [discoveries, setDiscoveries] = useState(initialDiscoveries);
  const [printerAgentId, setPrinterAgentId] = useState(
    printerAgents.find(a => a.status === 'active')?.id ?? '',
  );
  const [name, setName] = useState('');
  const [transport, setTransport] = useState<'tcp' | 'usb' | 'serial'>('tcp');
  const [address, setAddress] = useState('127.0.0.1');
  const [port, setPort] = useState('9100');
  const [path, setPath] = useState('/dev/usb/lp0');
  const [confirmNames, setConfirmNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  async function refreshLists() {
    const [printersResponse, discoveriesResponse] = await Promise.all([
      fetch('/api/console/printers'),
      fetch('/api/console/discoveries?pending=1'),
    ]);
    if (printersResponse.ok) {
      const body = await printersResponse.json() as { printers: PrinterListItem[] };
      setPrinters(body.printers);
    }
    if (discoveriesResponse.ok) {
      const body = await discoveriesResponse.json() as {
        discoveries: DiscoveryListItem[]
      };
      setDiscoveries(body.discoveries);
    }
    router.refresh();
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage)
      return;
    setPending(true);
    setError(null);

    const connectionHints
      = transport === 'tcp'
        ? {
            transport: 'tcp' as const,
            address,
            port: Number(port),
          }
        : transport === 'usb'
          ? { transport: 'usb' as const, path }
          : { transport: 'serial' as const, path };

    const response = await fetch('/api/console/printers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerAgentId,
        name,
        connectionHints,
      }),
    });

    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? messages.printers.createFailed);
      return;
    }

    setName('');
    await refreshLists();
  }

  async function onConfirm(discoveryId: string, suggestedName: string | null) {
    if (!canManage)
      return;
    const confirmName = (confirmNames[discoveryId] ?? suggestedName ?? '').trim();
    if (!confirmName) {
      setError('Name is required to confirm a discovery');
      return;
    }

    setActionId(discoveryId);
    setError(null);
    const response = await fetch(
      `/api/console/discoveries/${discoveryId}/confirm`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: confirmName }),
      },
    );
    setActionId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not confirm discovery');
      return;
    }
    await refreshLists();
  }

  async function onDisable(printerId: string) {
    if (!canManage)
      return;
    setActionId(printerId);
    setError(null);
    const response = await fetch(`/api/console/printers/${printerId}/disable`, {
      method: 'POST',
    });
    setActionId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not disable Printer');
      return;
    }
    await refreshLists();
  }

  const activeAgents = printerAgents.filter(a => a.status === 'active');
  const pendingDiscoveries = discoveries.filter(d => !d.confirmedPrinterId);

  return (
    <div className="stack">
      {canManage
        ? (
            <form className="org-form" onSubmit={onCreate}>
              <label>
                {messages.printers.agentLabel}
                <select
                  value={printerAgentId}
                  onChange={event => setPrinterAgentId(event.target.value)}
                  required
                  disabled={activeAgents.length === 0}
                >
                  {activeAgents.length === 0
                    ? <option value="">{messages.printers.noAgents}</option>
                    : activeAgents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                </select>
              </label>
              <label>
                {messages.printers.nameLabel}
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  required
                  minLength={1}
                  maxLength={120}
                />
              </label>
              <label>
                {messages.printers.transportLabel}
                <select
                  value={transport}
                  onChange={event => setTransport(event.target.value as typeof transport)}
                >
                  <option value="tcp">TCP</option>
                  <option value="usb">USB</option>
                  <option value="serial">Serial</option>
                </select>
              </label>
              {transport === 'tcp'
                ? (
                    <>
                      <label>
                        {messages.printers.addressLabel}
                        <input
                          value={address}
                          onChange={event => setAddress(event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        {messages.printers.portLabel}
                        <input
                          value={port}
                          onChange={event => setPort(event.target.value)}
                          required
                          inputMode="numeric"
                        />
                      </label>
                    </>
                  )
                : (
                    <label>
                      {messages.printers.pathLabel}
                      <input
                        value={path}
                        onChange={event => setPath(event.target.value)}
                        required
                      />
                    </label>
                  )}
              {error ? <p className="error" role="alert">{error}</p> : null}
              <button
                type="submit"
                disabled={
                  pending
                  || name.trim().length === 0
                  || activeAgents.length === 0
                }
              >
                {pending ? messages.printers.creating : messages.printers.create}
              </button>
            </form>
          )
        : (
            <p className="muted">{messages.printers.membersReadOnly}</p>
          )}

      {!canManage && error ? <p className="error" role="alert">{error}</p> : null}

      <div className="stack">
        <h2>Pending discoveries</h2>
        {pendingDiscoveries.length === 0
          ? (
              <p className="muted">
                No unconfirmed endpoints. Printer Agents report discoveries over the protocol.
              </p>
            )
          : (
              <ul className="agent-list">
                {pendingDiscoveries.map(item => (
                  <li key={item.id} className="agent-row">
                    <div>
                      <div className="agent-name">{item.endpointKey}</div>
                      <div className="muted agent-meta">
                        <span>
                          Printer Agent:
                          {' '}
                          {agentLabel(printerAgents, item.printerAgentId)}
                        </span>
                        <span>{formatHints(item.connectionHints)}</span>
                        <span>
                          Last seen:
                          {' '}
                          {new Date(item.lastSeenAt).toLocaleString()}
                        </span>
                      </div>
                      {canManage
                        ? (
                            <label>
                              Printer name
                              <input
                                value={
                                  confirmNames[item.id]
                                  ?? item.suggestedName
                                  ?? ''
                                }
                                onChange={event => setConfirmNames(current => ({
                                  ...current,
                                  [item.id]: event.target.value,
                                }))}
                                maxLength={120}
                                placeholder="Name this Printer"
                              />
                            </label>
                          )
                        : null}
                    </div>
                    {canManage
                      ? (
                          <div className="agent-actions">
                            <button
                              type="button"
                              disabled={actionId === item.id}
                              onClick={() => onConfirm(item.id, item.suggestedName)}
                            >
                              Confirm
                            </button>
                          </div>
                        )
                      : null}
                  </li>
                ))}
              </ul>
            )}
      </div>

      <div className="stack">
        <div className="agent-actions">
          <h2>{messages.printers.title}</h2>
          <button type="button" className="secondary" onClick={() => void refreshList()}>
            {messages.printers.refresh}
          </button>
        </div>
        {printers.length === 0
          ? <p className="muted">{messages.printers.empty}</p>
          : (
              <ul className="agent-list">
                {printers.map(item => (
                  <li key={item.id} className="agent-row">
                    <div>
                      <div className="agent-name">{item.name}</div>
                      <div className="muted agent-meta">
                        <span>
                          {item.status === 'active'
                            ? messages.printers.statusActive
                            : messages.printers.statusDisabled}
                        </span>
                        <span>
                          Printer Agent:
                          {' '}
                          {item.printerAgentName}
                        </span>
                        <span>
                          Agent presence:
                          {' '}
                          {item.printerAgentPresence}
                        </span>
                        <span>{formatHints(item.connectionHints)}</span>
                        <span className="agent-id">
                          printerId:
                          {' '}
                          {item.id}
                        </span>
                        <span className="agent-id">
                          printerAgentId:
                          {' '}
                          {item.printerAgentId}
                        </span>
                      </div>
                    </div>
                    {canManage && item.status === 'active'
                      ? (
                          <div className="agent-actions">
                            <button
                              type="button"
                              className="danger"
                              disabled={actionId === item.id}
                              onClick={() => onDisable(item.id)}
                            >
                              Disable
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
