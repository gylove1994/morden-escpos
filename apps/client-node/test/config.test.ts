/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseClientConfig } from '../src/config';

describe('parseClientConfig', () => {
  it('loads SERVER_URL and DEVICE_TOKEN from config file with env overrides', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'client-node-config-'));
    const configPath = path.join(dir, 'agent.json');
    writeFileSync(configPath, JSON.stringify({
      SERVER_URL: 'http://file.example:43128',
      DEVICE_TOKEN: 'token-from-file',
      POLL_IDLE_INITIAL_MS: '500',
    }));

    const config = parseClientConfig({
      NODE_ENV: 'test',
      CONFIG_FILE: configPath,
      DEVICE_TOKEN: 'token-from-env',
    });

    expect(config.SERVER_URL.replace(/\/$/, '')).toBe('http://file.example:43128');
    expect(config.DEVICE_TOKEN).toBe('token-from-env');
    expect(config.POLL_IDLE_INITIAL_MS).toBe(500);
  });

  it('reads APP_-prefixed keys in development', () => {
    const config = parseClientConfig({
      NODE_ENV: 'development',
      APP_SERVER_URL: 'http://127.0.0.1:43128',
      APP_DEVICE_TOKEN: 'dev-token',
      APP_POLL_IDLE_MAX_MS: '12000',
    });

    expect(config.SERVER_URL.replace(/\/$/, '')).toBe('http://127.0.0.1:43128');
    expect(config.DEVICE_TOKEN).toBe('dev-token');
    expect(config.POLL_IDLE_MAX_MS).toBe(12000);
  });

  it('rejects missing DEVICE_TOKEN', () => {
    expect(() => parseClientConfig({
      NODE_ENV: 'test',
      SERVER_URL: 'http://127.0.0.1:43128',
    })).toThrow(/DEVICE_TOKEN/);
  });
});
