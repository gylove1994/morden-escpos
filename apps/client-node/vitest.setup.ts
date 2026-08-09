/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import process from 'node:process';

// Minimal env so importing `src/config` during tests does not exit.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'info';
process.env.SERVER_URL = 'http://127.0.0.1:43128';
process.env.DEVICE_TOKEN = 'test-only-printer-agent-device-token';
process.env.POLL_IDLE_INITIAL_MS = '1000';
process.env.POLL_IDLE_MAX_MS = '30000';
process.env.POLL_IDLE_MULTIPLIER = '2';
process.env.POLL_AFTER_WORK_MS = '0';
