/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { FormEvent } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/ui/alert';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/ui/table';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface PrinterAgentListItem {
  id: string
  name: string
  status: 'active' | 'revoked'
  deviceTokenPrefix: string | null
  createdAt: string
  revokedAt: string | null
}

interface Props {
  initialPrinterAgents: PrinterAgentListItem[]
  canManage: boolean
}

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
      setError(body.message ?? 'Could not revoke device token');
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
    <div className="flex flex-col gap-6">
      {revealedToken
        ? (
            <Alert role="status">
              <AlertTitle>
                Device token
                {' '}
                {revealedToken.reason === 'created' ? 'created' : 'rotated'}
              </AlertTitle>
              <AlertDescription>
                <p>
                  Copy the token for
                  {' '}
                  <strong>{revealedToken.name}</strong>
                  {' '}
                  now. It will not be shown again.
                </p>
                <code className="mt-2 block break-all rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
                  {revealedToken.deviceToken}
                </code>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setRevealedToken(null)}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )
        : null}

      {canManage
        ? (
            <Card>
              <CardHeader>
                <CardTitle>Create Printer Agent</CardTitle>
                <CardDescription>
                  Registers an on-site agent and issues a one-time device token.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid max-w-md gap-3" onSubmit={onCreate}>
                  <div className="grid gap-1.5">
                    <Label htmlFor="printer-agent-name">Printer Agent name</Label>
                    <Input
                      id="printer-agent-name"
                      name="name"
                      value={name}
                      onChange={event => setName(event.target.value)}
                      required
                      minLength={1}
                      maxLength={120}
                      placeholder="Store front desk"
                    />
                  </div>
                  {error
                    ? (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )
                    : null}
                  <Button type="submit" disabled={pending || name.trim().length === 0}>
                    {pending ? 'Creating…' : 'Create Printer Agent'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        : (
            <p className="text-sm text-muted-foreground">
              Viewing only. owner or admin can create, revoke, or rotate device tokens.
            </p>
          )}

      {!canManage && error
        ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )
        : null}

      <Card>
        <CardHeader>
          <CardTitle>Registered Printer Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {printerAgents.length === 0
            ? (
                <p className="text-sm text-muted-foreground">
                  No Printer Agents yet. Create one to receive a device token.
                </p>
              )
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>ID</TableHead>
                      {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printerAgents.map(agent => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>
                          <Badge variant={agent.status === 'active' ? 'secondary' : 'outline'}>
                            {agent.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {agent.deviceTokenPrefix ? `${agent.deviceTokenPrefix}…` : 'none'}
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate font-mono text-xs text-muted-foreground">
                          {agent.id}
                        </TableCell>
                        {canManage
                          ? (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={actionId === agent.id}
                                    onClick={() => onRotate(agent.id, agent.name)}
                                  >
                                    Rotate token
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    disabled={actionId === agent.id || agent.status === 'revoked'}
                                    onClick={() => onRevoke(agent.id)}
                                  >
                                    Revoke
                                  </Button>
                                </div>
                              </TableCell>
                            )
                          : null}
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
