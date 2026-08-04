import type { PrintersResponse } from '../../../lib/printer-api';

import { NextResponse } from 'next/server';

import { findUsbPrinters, printerErrorMessage } from '../../../lib/printer-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  try {
    return NextResponse.json<PrintersResponse>(
      { printers: findUsbPrinters() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
  catch (error) {
    return NextResponse.json<PrintersResponse>(
      { printers: [], error: printerErrorMessage(error) },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
