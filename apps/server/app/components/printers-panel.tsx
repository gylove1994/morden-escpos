/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useConsoleI18n } from '../../lib/i18n/client';

export type PrinterListItem = {
  id: string
  printerAgentId: string
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
};

export type PrinterAgentOption = {
  id: string
  name: string
  status: string
};

type Props = {
  initialPrinters: PrinterListItem[]
  printerAgents: PrinterAgentOption[]
  canManage: boolean
};

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

export function PrintersPanel({
  initialPrinters,
  printerAgents,
  canManage,
}: Props) {
  const router = useRouter();
  const { messages } = useConsoleI18n();
  const [printers, setPrinters] = useState(initialPrinters);
  const [printerAgentId, setPrinterAgentId] = useState(
    printerAgents.find(a => a.status === 'active')?.id ?? '',
  );
  const [name, setName] = useState('');
  const [transport, setTransport] = useState<'tcp' | 'usb' | 'serial'>('tcp');
  const [address, setAddress] = useState('127.0.0.1');
  const [port, setPort] = useState('9100');
  const [path, setPath] = useState('/dev/usb/lp0');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refreshList() {
    const response = await fetch('/api/console/printers');
    if (!response.ok) return;
    const body = await response.json() as { printers: PrinterListItem[] };
    setPrinters(body.printers);
    router.refresh();
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
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
    await refreshList();
  }

  const activeAgents = printerAgents.filter(a => a.status === 'active');

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
                  </li>
                ))}
              </ul>
            )}
      </div>
    </div>
  );
}
