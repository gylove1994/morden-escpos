/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { OrganizationStatus } from '../../lib/platform/tenant-status';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/ui/table';
import { useState } from 'react';

interface PlatformOrganization {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  createdAt: string
}

async function platformFetch<T>(
  url: string,
  secret: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${secret}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const data = await response.json() as T & { error?: string, message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? `Request failed (${response.status})`);
  }
  return data;
}

export function PlatformTenantOps() {
  const [secret, setSecret] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlatformOrganization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function lookup() {
    setError(null);
    setPending('lookup');
    try {
      const data = await platformFetch<{ organizations: PlatformOrganization[] }>(
        `/api/platform/organizations?q=${encodeURIComponent(query)}`,
        secret,
      );
      setResults(data.organizations);
    }
    catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : 'Lookup failed');
    }
    finally {
      setPending(null);
    }
  }

  async function setStatus(organizationId: string, status: OrganizationStatus) {
    setError(null);
    setPending(`${organizationId}:${status}`);
    try {
      const data = await platformFetch<{ organization: PlatformOrganization }>(
        `/api/platform/organizations/${organizationId}/status`,
        secret,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
      );
      setResults(current =>
        current.map(org => (org.id === organizationId ? data.organization : org)),
      );
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
    finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Lookup</CardTitle>
          <CardDescription>
            Authenticate with
            {' '}
            <code>PLATFORM_ADMIN_SECRET</code>
            {' '}
            then search by id, slug, or name.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="platform-secret">Platform admin secret</Label>
            <Input
              id="platform-secret"
              type="password"
              autoComplete="off"
              value={secret}
              onChange={event => setSecret(event.target.value)}
              placeholder="PLATFORM_ADMIN_SECRET"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="platform-query">Organization query</Label>
            <Input
              id="platform-query"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="id, slug, or name"
            />
          </div>
          <Button
            type="button"
            disabled={!secret || !query || pending !== null}
            onClick={() => void lookup()}
          >
            {pending === 'lookup' ? 'Looking up…' : 'Lookup'}
          </Button>
          {error
            ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )
            : null}
        </CardContent>
      </Card>

      {results.length > 0
        ? (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map(org => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-xs text-muted-foreground">{org.slug}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={org.status === 'active' ? 'secondary' : 'destructive'}>
                            {org.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate font-mono text-xs text-muted-foreground">
                          {org.id}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={pending !== null || org.status === 'suspended'}
                              onClick={() => void setStatus(org.id, 'suspended')}
                            >
                              Suspend
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={pending !== null || org.status === 'banned'}
                              onClick={() => void setStatus(org.id, 'banned')}
                            >
                              Ban
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending !== null || org.status === 'active'}
                              onClick={() => void setStatus(org.id, 'active')}
                            >
                              Restore
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        : null}
    </div>
  );
}
