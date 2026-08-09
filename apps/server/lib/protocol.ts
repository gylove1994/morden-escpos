/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Checked-in OpenAPI skeleton for the Print Queue Agent Protocol. */
export const PRINT_QUEUE_AGENT_PROTOCOL_OPENAPI_RELATIVE_PATH
  = 'contracts/print-queue-agent-protocol.openapi.yaml';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(moduleDir, '..');

export function getPrintQueueAgentProtocolOpenApiPath(): string {
  return path.join(serverRoot, PRINT_QUEUE_AGENT_PROTOCOL_OPENAPI_RELATIVE_PATH);
}

export async function readPrintQueueAgentProtocolOpenApi(): Promise<string> {
  return readFile(getPrintQueueAgentProtocolOpenApiPath(), 'utf8');
}
