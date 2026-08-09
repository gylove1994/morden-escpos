/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

export type PrinterGroupListItem = {
  id: string
  printerAgentId: string
  name: string
  printerIds: string[]
  createdAt: string
};

export type PrinterAgentOption = {
  id: string
  name: string
  status: string
};

export type PrinterOption = {
  id: string
  printerAgentId: string
  name: string
  status: string
};

type Props = {
  initialGroups: PrinterGroupListItem[]
  printerAgents: PrinterAgentOption[]
  printers: PrinterOption[]
  canManage: boolean
};

export function PrinterGroupsPanel({
  initialGroups,
  printerAgents,
  printers,
  canManage,
}: Props) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [printerAgentId, setPrinterAgentId] = useState(
    printerAgents.find(a => a.status === 'active')?.id ?? '',
  );
  const [name, setName] = useState('');
  const [selectedPrinterIds, setSelectedPrinterIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const activeAgents = printerAgents.filter(a => a.status === 'active');
  const printersForAgent = useMemo(
    () => printers.filter(p => p.printerAgentId === printerAgentId),
    [printers, printerAgentId],
  );

  async function refreshList() {
    const response = await fetch('/api/console/printer-groups');
    if (!response.ok) return;
    const body = await response.json() as { printerGroups: PrinterGroupListItem[] };
    setGroups(body.printerGroups);
    router.refresh();
  }

  function togglePrinter(printerId: string) {
    setSelectedPrinterIds((current) => {
      if (current.includes(printerId)) {
        return current.filter(id => id !== printerId);
      }
      return [...current, printerId];
    });
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    setPending(true);
    setError(null);

    const response = await fetch('/api/console/printer-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerAgentId,
        name,
        printerIds: selectedPrinterIds,
      }),
    });

    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not create Printer Group');
      return;
    }

    setName('');
    setSelectedPrinterIds([]);
    await refreshList();
  }

  return (
    <div className="stack">
      {canManage
        ? (
            <form className="org-form" onSubmit={onCreate}>
              <label>
                Printer Agent
                <select
                  value={printerAgentId}
                  onChange={(event) => {
                    setPrinterAgentId(event.target.value);
                    setSelectedPrinterIds([]);
                  }}
                  required
                  disabled={activeAgents.length === 0}
                >
                  {activeAgents.length === 0
                    ? <option value="">No active Printer Agents</option>
                    : activeAgents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                </select>
              </label>
              <label>
                Group name
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  required
                  maxLength={120}
                  placeholder="Kitchen"
                />
              </label>
              <fieldset>
                <legend>Member Printers (same Printer Agent)</legend>
                {printersForAgent.length === 0
                  ? <p className="muted">No Printers under this Printer Agent yet.</p>
                  : printersForAgent.map(item => (
                      <label key={item.id} className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={selectedPrinterIds.includes(item.id)}
                          onChange={() => togglePrinter(item.id)}
                        />
                        {item.name}
                        {' '}
                        (
                        {item.status}
                        )
                      </label>
                    ))}
              </fieldset>
              {error ? <p className="error" role="alert">{error}</p> : null}
              <button
                type="submit"
                disabled={pending || activeAgents.length === 0 || name.trim().length === 0}
              >
                {pending ? 'Creating…' : 'Create Printer Group'}
              </button>
            </form>
          )
        : <p className="muted">Only owner/admin may create or update Printer Groups.</p>}

      <div className="stack">
        <div className="agent-actions">
          <h2>Printer Groups</h2>
          <button type="button" className="secondary" onClick={() => void refreshList()}>
            Refresh
          </button>
        </div>
        {groups.length === 0
          ? <p className="muted">No Printer Groups yet.</p>
          : (
              <ul className="agent-list">
                {groups.map((group) => {
                  const memberNames = group.printerIds
                    .map(id => printers.find(p => p.id === id)?.name ?? id)
                    .join(', ');
                  const agentName = printerAgents.find(a => a.id === group.printerAgentId)?.name
                    ?? group.printerAgentId;
                  return (
                    <li key={group.id} className="agent-row">
                      <div>
                        <div className="agent-name">{group.name}</div>
                        <div className="muted agent-meta">
                          <span>
                            Printer Agent:
                            {' '}
                            {agentName}
                          </span>
                          <span>
                            Members (
                            {group.printerIds.length}
                            ):
                            {' '}
                            {memberNames || 'none'}
                          </span>
                          <span className="agent-id">
                            printerGroupId:
                            {' '}
                            {group.id}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
      </div>
    </div>
  );
}
