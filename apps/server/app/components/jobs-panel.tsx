/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface JobListItem {
  id: string
  printerId: string | null
  printerGroupId: string | null
  parentJobId: string | null
  kind: string
  printerAgentId: string
  status: string
  payloadByteLength: number
  idempotencyKey: string | null
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
}

export interface PrinterOption {
  id: string
  name: string
  status: string
}

export interface PrinterGroupOption {
  id: string
  name: string
  printerIds: string[]
}

interface Props {
  initialJobs: JobListItem[]
  printers: PrinterOption[]
  printerGroups: PrinterGroupOption[]
}

export function JobsPanel({ initialJobs, printers, printerGroups }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [targetKind, setTargetKind] = useState<'printer' | 'group'>(
    printers.some(p => p.status === 'active') ? 'printer' : 'group',
  );
  const [printerId, setPrinterId] = useState(
    printers.find(p => p.status === 'active')?.id ?? '',
  );
  const [printerGroupId, setPrinterGroupId] = useState(
    printerGroups[0]?.id ?? '',
  );
  const [payloadText, setPayloadText] = useState('Hello from morden-escpos');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const activePrinters = printers.filter(p => p.status === 'active');

  async function refreshList() {
    const response = await fetch('/api/console/jobs');
    if (!response.ok)
      return;
    const body = await response.json() as { jobs: JobListItem[] };
    setJobs(body.jobs);
    router.refresh();
  }

  async function onEnqueue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setLastMessage(null);

    const payloadBase64 = btoa(payloadText);
    const response = await fetch('/api/console/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(targetKind === 'printer'
          ? { printerId }
          : { printerGroupId }),
        payloadBase64,
        ...(idempotencyKey.trim()
          ? { idempotencyKey: idempotencyKey.trim() }
          : {}),
      }),
    });

    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not enqueue job');
      return;
    }

    const body = await response.json() as {
      job: JobListItem
      children?: JobListItem[]
      deduped: boolean
    };
    const childCount = body.children?.length ?? 0;
    setLastMessage(
      body.deduped
        ? `Idempotent replay — existing job ${body.job.id} (${body.job.status})`
        : childCount > 0
          ? `Enqueued parent ${body.job.id} with ${childCount} child jobs`
          : `Enqueued job ${body.job.id}`,
    );
    await refreshList();
  }

  async function onRetry(jobId: string) {
    setError(null);
    const response = await fetch(`/api/console/jobs/${jobId}/retry`, {
      method: 'POST',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'Could not retry job');
      return;
    }
    setLastMessage(`Retried child job ${jobId}`);
    await refreshList();
  }

  const canSubmit = targetKind === 'printer'
    ? activePrinters.length > 0 && printerId.length > 0
    : printerGroups.length > 0 && printerGroupId.length > 0;

  return (
    <div className="stack">
      <form className="org-form" onSubmit={onEnqueue}>
        <label>
          Target
          <select
            value={targetKind}
            onChange={event => setTargetKind(event.target.value as 'printer' | 'group')}
          >
            <option value="printer">Printer</option>
            <option value="group">Printer Group</option>
          </select>
        </label>
        {targetKind === 'printer'
          ? (
              <label>
                Target Printer
                <select
                  value={printerId}
                  onChange={event => setPrinterId(event.target.value)}
                  required
                  disabled={activePrinters.length === 0}
                >
                  {activePrinters.length === 0
                    ? <option value="">No active Printers</option>
                    : activePrinters.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                </select>
              </label>
            )
          : (
              <label>
                Target Printer Group
                <select
                  value={printerGroupId}
                  onChange={event => setPrinterGroupId(event.target.value)}
                  required
                  disabled={printerGroups.length === 0}
                >
                  {printerGroups.length === 0
                    ? <option value="">No Printer Groups</option>
                    : printerGroups.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {' '}
                          (
                          {item.printerIds.length}
                          {' '}
                          members)
                        </option>
                      ))}
                </select>
              </label>
            )}
        <label>
          Raw text (encoded to ESC/POS-ish base64 for demo)
          <textarea
            value={payloadText}
            onChange={event => setPayloadText(event.target.value)}
            required
            rows={3}
          />
        </label>
        <label>
          Idempotency key (optional)
          <input
            value={idempotencyKey}
            onChange={event => setIdempotencyKey(event.target.value)}
            maxLength={200}
            placeholder="order-42-retry"
          />
        </label>
        {error ? <p className="error" role="alert">{error}</p> : null}
        {lastMessage ? <p className="muted" role="status">{lastMessage}</p> : null}
        <button
          type="submit"
          disabled={pending || !canSubmit || payloadText.length === 0}
        >
          {pending ? 'Enqueueing…' : 'Enqueue raw job'}
        </button>
      </form>

      <div className="stack">
        <div className="agent-actions">
          <h2>Job history</h2>
          <button type="button" className="secondary" onClick={() => void refreshList()}>
            Refresh
          </button>
        </div>
        {jobs.length === 0
          ? <p className="muted">No jobs yet.</p>
          : (
              <ul className="agent-list">
                {jobs.map(job => (
                  <li key={job.id} className="agent-row">
                    <div>
                      <div className="agent-name">
                        {job.kind}
                        {' '}
                        ·
                        {' '}
                        {job.status}
                        {' '}
                        ·
                        {' '}
                        {job.payloadByteLength}
                        {' '}
                        bytes
                      </div>
                      <div className="muted agent-meta">
                        <span className="agent-id">
                          jobId:
                          {' '}
                          {job.id}
                        </span>
                        {job.printerId
                          ? (
                              <span className="agent-id">
                                printerId:
                                {' '}
                                {job.printerId}
                              </span>
                            )
                          : null}
                        {job.printerGroupId
                          ? (
                              <span className="agent-id">
                                printerGroupId:
                                {' '}
                                {job.printerGroupId}
                              </span>
                            )
                          : null}
                        {job.parentJobId
                          ? (
                              <span className="agent-id">
                                parentJobId:
                                {' '}
                                {job.parentJobId}
                              </span>
                            )
                          : null}
                        <span>
                          Created:
                          {' '}
                          {new Date(job.createdAt).toLocaleString()}
                        </span>
                        {job.idempotencyKey
                          ? (
                              <span>
                                Idempotency:
                                {' '}
                                {job.idempotencyKey}
                              </span>
                            )
                          : null}
                        {job.errorMessage
                          ? (
                              <span className="error">
                                Error:
                                {' '}
                                {job.errorMessage}
                              </span>
                            )
                          : null}
                      </div>
                    </div>
                    {job.kind === 'child' && job.status === 'failed'
                      ? (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => void onRetry(job.id)}
                          >
                            Retry child
                          </button>
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
