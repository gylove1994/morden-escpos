/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useConsoleI18n } from '../../lib/i18n/client';
import { formatMessage } from '../../lib/i18n/messages';

export interface JobListItem {
  id: string
  printerId: string
  printerAgentId: string
  status: string
  kind: 'raw' | 'template_confirmation'
  parentJobId: string | null
  childCount: number
  relation: 'standalone' | 'parent' | 'child'
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

function statusLabel(
  status: string,
  messages: ReturnType<typeof useConsoleI18n>['messages'],
): string {
  switch (status) {
    case 'queued':
      return messages.jobs.statusQueued;
    case 'leased':
      return messages.jobs.statusLeased;
    case 'printing':
      return messages.jobs.statusPrinting;
    case 'succeeded':
      return messages.jobs.statusSucceeded;
    case 'failed':
      return messages.jobs.statusFailed;
    default:
      return status;
  }
}

function relationLabel(
  job: JobListItem,
  messages: ReturnType<typeof useConsoleI18n>['messages'],
): string {
  if (job.relation === 'child' && job.parentJobId) {
    return formatMessage(messages.jobs.relationChild, {
      parentId: job.parentJobId,
    });
  }
  if (job.relation === 'parent') {
    return formatMessage(messages.jobs.relationParent, {
      count: job.childCount,
    });
  }
  return messages.jobs.relationStandalone;
}

export function JobsPanel({ initialJobs, printers }: Props) {
  const router = useRouter();
  const { messages, locale } = useConsoleI18n();
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
      setError(body.message ?? messages.jobs.enqueueFailed);
      return;
    }

    const body = await response.json() as {
      job: JobListItem
      deduped: boolean
    };
    setLastMessage(
      body.deduped
        ? formatMessage(messages.jobs.idempotentReplay, {
            id: body.job.id,
            status: statusLabel(body.job.status, messages),
          })
        : formatMessage(messages.jobs.enqueued, { id: body.job.id }),
    );
    await refreshList();
  }

  return (
    <div className="stack">
      <form className="org-form" onSubmit={onEnqueue}>
        <label>
          {messages.jobs.targetPrinter}
          <select
            value={printerId}
            onChange={event => setPrinterId(event.target.value)}
            required
            disabled={activePrinters.length === 0}
          >
            {activePrinters.length === 0
              ? <option value="">{messages.jobs.noActivePrinters}</option>
              : activePrinters.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
          </select>
        </label>
        <label>
          {messages.jobs.rawTextLabel}
          <textarea
            value={payloadText}
            onChange={event => setPayloadText(event.target.value)}
            required
            rows={3}
          />
        </label>
        <label>
          {messages.jobs.idempotencyLabel}
          <input
            value={idempotencyKey}
            onChange={event => setIdempotencyKey(event.target.value)}
            maxLength={200}
            placeholder={messages.jobs.idempotencyPlaceholder}
          />
        </label>
        {error ? <p className="error" role="alert">{error}</p> : null}
        {lastMessage ? <p className="muted" role="status">{lastMessage}</p> : null}
        <button
          type="submit"
          disabled={pending || activePrinters.length === 0 || payloadText.length === 0}
        >
          {pending ? messages.jobs.enqueueing : messages.jobs.enqueue}
        </button>
      </form>

      <div className="stack">
        <div className="agent-actions">
          <h2>{messages.jobs.historyTitle}</h2>
          <button type="button" className="secondary" onClick={() => void refreshList()}>
            {messages.jobs.refresh}
          </button>
        </div>
        {jobs.length === 0
          ? <p className="muted">{messages.jobs.empty}</p>
          : (
              <ul className="agent-list">
                {jobs.map(job => (
                  <li key={job.id} className="agent-row">
                    <div>
                      <div className="agent-name">
                        <span
                          className={
                            job.status === 'failed'
                              ? 'job-status job-status-failed'
                              : 'job-status'
                          }
                        >
                          {statusLabel(job.status, messages)}
                        </span>
                        {' '}
                        ·
                        {' '}
                        {job.payloadByteLength}
                        {' '}
                        {messages.jobs.bytes}
                      </div>
                      <div className="job-labels" aria-label="job labels">
                        <span
                          className={
                            job.kind === 'template_confirmation'
                              ? 'job-label job-label-confirmation'
                              : 'job-label'
                          }
                          data-job-kind={job.kind}
                        >
                          {job.kind === 'template_confirmation'
                            ? messages.jobs.kindConfirmation
                            : messages.jobs.kindRaw}
                        </span>
                        <span
                          className="job-label job-label-relation"
                          data-job-relation={job.relation}
                        >
                          {relationLabel(job, messages)}
                        </span>
                      </div>
                      <div className="muted agent-meta">
                        <span className="agent-id">
                          {messages.jobs.jobId}
                          :
                          {' '}
                          {job.id}
                        </span>
                        <span className="agent-id">
                          {messages.jobs.printerId}
                          :
                          {' '}
                          {job.printerId}
                        </span>
                        {job.parentJobId
                          ? (
                              <span className="agent-id">
                                {messages.jobs.parentJob}
                                :
                                {' '}
                                {job.parentJobId}
                              </span>
                            )
                          : null}
                        {job.childCount > 0
                          ? (
                              <span>
                                {messages.jobs.childCount}
                                :
                                {' '}
                                {job.childCount}
                              </span>
                            )
                          : null}
                        <span>
                          {messages.jobs.created}
                          :
                          {' '}
                          {new Date(job.createdAt).toLocaleString(locale)}
                        </span>
                        {job.completedAt
                          ? (
                              <span>
                                {messages.jobs.completed}
                                :
                                {' '}
                                {new Date(job.completedAt).toLocaleString(locale)}
                              </span>
                            )
                          : null}
                        {job.idempotencyKey
                          ? (
                              <span>
                                {messages.jobs.idempotency}
                                :
                                {' '}
                                {job.idempotencyKey}
                              </span>
                            )
                          : null}
                        {job.errorMessage
                          ? (
                              <span className="error" data-job-error>
                                {messages.jobs.error}
                                :
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
