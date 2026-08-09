/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { SERVER_CONFIG } from '../lib/config';

export function authOriginHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('Origin', SERVER_CONFIG.BASE_URL);
  headers.set('Content-Type', 'application/json');
  return headers;
}

/** Collect Set-Cookie values into a Cookie request header string. */
export function mergeCookies(
  existing: string | undefined,
  response: Response,
): string {
  const jar = new Map<string, string>();

  if (existing) {
    for (const part of existing.split(';')) {
      const trimmed = part.trim();
      if (!trimmed)
        continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1)
        continue;
      jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
    }
  }

  const setCookies
    = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];

  for (const raw of setCookies) {
    const first = raw.split(';')[0] ?? '';
    const eq = first.indexOf('=');
    if (eq === -1)
      continue;
    const name = first.slice(0, eq);
    const value = first.slice(eq + 1);
    if (value === '' || value.toLowerCase() === 'deleted') {
      jar.delete(name);
    }
    else {
      jar.set(name, value);
    }
  }

  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

export async function signUp(
  baseUrl: string,
  input: { name: string, email: string, password: string },
  cookie?: string,
): Promise<{ response: Response, cookie: string }> {
  const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: authOriginHeaders(cookie ? { Cookie: cookie } : undefined),
    body: JSON.stringify(input),
  });
  return { response, cookie: mergeCookies(cookie, response) };
}

export async function signIn(
  baseUrl: string,
  input: { email: string, password: string },
  cookie?: string,
): Promise<{ response: Response, cookie: string }> {
  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: authOriginHeaders(cookie ? { Cookie: cookie } : undefined),
    body: JSON.stringify(input),
  });
  return { response, cookie: mergeCookies(cookie, response) };
}

export async function createOrganization(
  baseUrl: string,
  cookie: string,
  input: { name: string, slug: string },
): Promise<{ response: Response, cookie: string }> {
  const response = await fetch(`${baseUrl}/api/auth/organization/create`, {
    method: 'POST',
    headers: authOriginHeaders({ Cookie: cookie }),
    body: JSON.stringify(input),
  });
  return { response, cookie: mergeCookies(cookie, response) };
}
