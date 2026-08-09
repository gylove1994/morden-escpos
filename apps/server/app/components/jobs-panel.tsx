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
  printerId: string
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

interface Props {
  initialJobs: JobListItem[]
  printers: PrinterOption[]
}

export function JobsPanel({ initialJobs, printers }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [printerId, setPrinterId] = useState(
    printers.find(p => p.status === 'active')?.id ?? '',
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
        printerId,
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
      deduped: boolean
    };
    setLastMessage(
      body.deduped
        ? `Idempotent replay — existing job ${body.job.id} (${body.job.status})`
        : `Enqueued job ${body.job.id}`,
    );
    await refreshList();
  }

  return (
    <div className="stack">
      <form className="org-form" onSubmit={onEnqueue}>
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
          disabled={pending || activePrinters.length === 0 || payloadText.length === 0}
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
                        <span className="agent-id">
                          printerId:
                          {' '}
                          {job.printerId}
                        </span>
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
                  </li>
                ))}
              </ul>
            )}
      </div>
    </div>
  );
}
