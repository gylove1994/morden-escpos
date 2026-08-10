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
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface PrinterListItem {
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
}

export interface PrinterAgentOption {
  id: string
  name: string
  status: string
}

interface Props {
  initialPrinters: PrinterListItem[]
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

export function PrintersPanel({
  initialPrinters,
  printerAgents,
  canManage,
}: Props) {
  const router = useRouter();
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
    if (!response.ok)
      return;
    const body = await response.json() as { printers: PrinterListItem[] };
    setPrinters(body.printers);
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
      setError(body.message ?? 'Could not create Printer');
      return;
    }

    setName('');
    await refreshList();
  }

  const activeAgents = printerAgents.filter(a => a.status === 'active');

  return (
    <div className="flex flex-col gap-6">
      {canManage
        ? (
            <Card>
              <CardHeader>
                <CardTitle>Create Printer</CardTitle>
                <CardDescription>
                  Bind a logical Printer to an active Printer Agent with connection hints.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid max-w-md gap-3" onSubmit={onCreate}>
                  <div className="grid gap-1.5">
                    <Label>Printer Agent</Label>
                    <Select
                      value={printerAgentId || undefined}
                      onValueChange={value => setPrinterAgentId(value ?? '')}
                      disabled={activeAgents.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No active Printer Agents" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeAgents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="printer-name">Printer name</Label>
                    <Input
                      id="printer-name"
                      value={name}
                      onChange={event => setName(event.target.value)}
                      required
                      minLength={1}
                      maxLength={120}
                      placeholder="Kitchen receipt"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Transport</Label>
                    <Select
                      value={transport}
                      onValueChange={(value) => {
                        if (value === 'tcp' || value === 'usb' || value === 'serial') {
                          setTransport(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="usb">USB</SelectItem>
                        <SelectItem value="serial">Serial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {transport === 'tcp'
                    ? (
                        <>
                          <div className="grid gap-1.5">
                            <Label htmlFor="printer-address">Address</Label>
                            <Input
                              id="printer-address"
                              value={address}
                              onChange={event => setAddress(event.target.value)}
                              required
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="printer-port">Port</Label>
                            <Input
                              id="printer-port"
                              value={port}
                              onChange={event => setPort(event.target.value)}
                              required
                              inputMode="numeric"
                            />
                          </div>
                        </>
                      )
                    : (
                        <div className="grid gap-1.5">
                          <Label htmlFor="printer-path">Path</Label>
                          <Input
                            id="printer-path"
                            value={path}
                            onChange={event => setPath(event.target.value)}
                            required
                          />
                        </div>
                      )}
                  {error
                    ? (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )
                    : null}
                  <Button
                    type="submit"
                    disabled={
                      pending
                      || name.trim().length === 0
                      || activeAgents.length === 0
                    }
                  >
                    {pending ? 'Creating…' : 'Create Printer'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        : (
            <p className="text-sm text-muted-foreground">
              Viewing only. owner or admin can create Printers under a Printer Agent.
            </p>
          )}

      <Card>
        <CardHeader>
          <CardTitle>Printers</CardTitle>
        </CardHeader>
        <CardContent>
          {printers.length === 0
            ? (
                <p className="text-sm text-muted-foreground">
                  No Printers yet. Create one under a Printer Agent.
                </p>
              )
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Printer ID</TableHead>
                      <TableHead>Printer Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printers.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'active' ? 'secondary' : 'outline'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatHints(item.connectionHints)}
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate font-mono text-xs text-muted-foreground">
                          {item.id}
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate font-mono text-xs text-muted-foreground">
                          {item.printerAgentId}
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
