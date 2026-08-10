/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { FormEvent } from 'react';
import { Alert, AlertDescription } from '@workspace/ui/components/ui/alert';
import { Badge } from '@workspace/ui/components/ui/badge';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/ui/card';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/ui/table';
import { Textarea } from '@workspace/ui/components/ui/textarea';
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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Enqueue job</CardTitle>
          <CardDescription>
            Demo path: encode raw text to base64 and enqueue against an active Printer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid max-w-lg gap-3" onSubmit={onEnqueue}>
            <div className="grid gap-1.5">
              <Label>Target Printer</Label>
              <Select
                value={printerId || undefined}
                onValueChange={value => setPrinterId(value ?? '')}
                disabled={activePrinters.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No active Printers" />
                </SelectTrigger>
                <SelectContent>
                  {activePrinters.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="job-payload">Raw text (encoded to ESC/POS-ish base64 for demo)</Label>
              <Textarea
                id="job-payload"
                value={payloadText}
                onChange={event => setPayloadText(event.target.value)}
                required
                rows={3}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="job-idempotency">Idempotency key (optional)</Label>
              <Input
                id="job-idempotency"
                value={idempotencyKey}
                onChange={event => setIdempotencyKey(event.target.value)}
                maxLength={200}
                placeholder="order-42-retry"
              />
            </div>
            {error
              ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )
              : null}
            {lastMessage
              ? (
                  <Alert role="status">
                    <AlertDescription>{lastMessage}</AlertDescription>
                  </Alert>
                )
              : null}
            <Button
              type="submit"
              disabled={pending || activePrinters.length === 0 || payloadText.length === 0}
            >
              {pending ? 'Enqueueing…' : 'Enqueue raw job'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Job history</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={() => void refreshList()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0
            ? <p className="text-sm text-muted-foreground">No jobs yet.</p>
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Bytes</TableHead>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Printer</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Badge variant="secondary">{job.status}</Badge>
                        </TableCell>
                        <TableCell>{job.payloadByteLength}</TableCell>
                        <TableCell className="max-w-[10rem] truncate font-mono text-xs text-muted-foreground">
                          {job.id}
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate font-mono text-xs text-muted-foreground">
                          {job.printerId}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(job.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
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
                                <span className="text-destructive">
                                  {job.idempotencyKey ? ' · ' : null}
                                  Error:
                                  {' '}
                                  {job.errorMessage}
                                </span>
                              )
                            : null}
                          {!job.idempotencyKey && !job.errorMessage ? '—' : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
