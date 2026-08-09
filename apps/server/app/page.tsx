/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import { EDITION } from '../lib/edition';

export default function HomePage() {
  return (
    <main>
      <h1>morden-escpos</h1>
      <p>
        BSL SaaS print-queue server scaffold (
        {EDITION}
        {' '}
        edition).
      </p>
      <p>
        Operators: use
        {' '}
        <a href="/api/health">/api/health</a>
        .
        Contributors: Print Queue Agent Protocol OpenAPI at
        {' '}
        <a href="/api/protocol/openapi">/api/protocol/openapi</a>
        .
      </p>
    </main>
  );
}
