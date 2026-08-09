#!/usr/bin/env node
/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import process from 'node:process';
import { IdleBackoff } from './backoff';
import { CLIENT_CONFIG } from './config';
import { runPrinterAgentLoop } from './loop';
import { ProtocolClient } from './protocol/client';

async function main(): Promise<void> {
  const client = new ProtocolClient({
    serverUrl: CLIENT_CONFIG.SERVER_URL,
    deviceToken: CLIENT_CONFIG.DEVICE_TOKEN,
  });

  const heartbeat = await client.heartbeat();
  console.info('[printer-agent] Authenticated Printer Agent', {
    printerAgentId: heartbeat.printerAgentId,
    organizationId: heartbeat.organizationId,
    serverUrl: CLIENT_CONFIG.SERVER_URL,
  });

  const backoff = new IdleBackoff({
    initialMs: CLIENT_CONFIG.POLL_IDLE_INITIAL_MS,
    maxMs: CLIENT_CONFIG.POLL_IDLE_MAX_MS,
    multiplier: CLIENT_CONFIG.POLL_IDLE_MULTIPLIER,
  });

  const abort = new AbortController();
  const onSignal = () => abort.abort();
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  await runPrinterAgentLoop({
    client,
    backoff,
    afterWorkMs: CLIENT_CONFIG.POLL_AFTER_WORK_MS,
    signal: abort.signal,
  });
}

main().catch((error) => {
  console.error('[printer-agent] Fatal error', error);
  process.exit(1);
});
