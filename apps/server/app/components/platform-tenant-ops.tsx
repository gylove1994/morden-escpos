/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import type { OrganizationStatus } from '../../lib/platform/tenant-status';
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
    <section className="stack">
      <label className="stack">
        <span>Platform admin secret</span>
        <input
          type="password"
          autoComplete="off"
          value={secret}
          onChange={event => setSecret(event.target.value)}
          placeholder="PLATFORM_ADMIN_SECRET"
        />
      </label>

      <label className="stack">
        <span>Look up Organization</span>
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="id, slug, or name"
        />
      </label>

      <button type="button" disabled={!secret || !query || pending !== null} onClick={() => void lookup()}>
        {pending === 'lookup' ? 'Looking up…' : 'Lookup'}
      </button>

      {error ? <p className="error" role="alert">{error}</p> : null}

      {results.length > 0
        ? (
            <ul className="stack">
              {results.map(org => (
                <li key={org.id}>
                  <div>
                    <strong>{org.name}</strong>
                    {' '}
                    (
                    {org.slug}
                    )
                  </div>
                  <div className="muted">
                    id:
                    {' '}
                    {org.id}
                  </div>
                  <div>
                    Status:
                    {' '}
                    <strong>{org.status}</strong>
                  </div>
                  <div className="row">
                    <button
                      type="button"
                      disabled={pending !== null || org.status === 'suspended'}
                      onClick={() => void setStatus(org.id, 'suspended')}
                    >
                      Suspend
                    </button>
                    <button
                      type="button"
                      disabled={pending !== null || org.status === 'banned'}
                      onClick={() => void setStatus(org.id, 'banned')}
                    >
                      Ban
                    </button>
                    <button
                      type="button"
                      disabled={pending !== null || org.status === 'active'}
                      onClick={() => void setStatus(org.id, 'active')}
                    >
                      Restore
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        : null}
    </section>
  );
}
