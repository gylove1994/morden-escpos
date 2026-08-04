import type { PrintResponse } from '../../../lib/printer-api';

import { TemplateEngine } from 'morden-node-escpos/template';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isRemoteImagePath } from '../../../lib/image-path';
import { validatePrintJob } from '../../../lib/print-job';
import { findUsbPrinters, printerErrorMessage, printTemplate } from '../../../lib/printer-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  printer: z.object({
    vendorId: z.number().int().nonnegative(),
    productId: z.number().int().nonnegative(),
    busNumber: z.number().int().nonnegative(),
    deviceAddress: z.number().int().nonnegative(),
  }),
  template: z.unknown(),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  }
  catch {
    return NextResponse.json<PrintResponse>(
      { ok: false, message: '打印请求不是有效的 JSON。' },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<PrintResponse>(
      { ok: false, message: '打印请求缺少打印机、模板或示例数据。' },
      { status: 400 },
    );
  }

  const validation = validatePrintJob(parsed.data.template);
  if (!validation.job) {
    return NextResponse.json<PrintResponse>(
      { ok: false, message: validation.errors[0] ?? '模板格式无效。' },
      { status: 400 },
    );
  }

  let renderedJob;
  try {
    renderedJob = new TemplateEngine().render(validation.job, parsed.data.data);
  }
  catch (error) {
    return NextResponse.json<PrintResponse>(
      { ok: false, message: error instanceof Error ? error.message : '模板数据无法渲染。' },
      { status: 400 },
    );
  }

  const invalidImagePath = renderedJob.commands.find(command =>
    (command.type === 'image' || command.type === 'raster')
    && !isRemoteImagePath(command.path),
  );
  if (invalidImagePath) {
    return NextResponse.json<PrintResponse>(
      { ok: false, message: '图片命令必须使用可公开访问的 http(s) 网络地址。' },
      { status: 400 },
    );
  }

  try {
    const printer = findUsbPrinters().find(device =>
      device.vendorId === parsed.data.printer.vendorId
      && device.productId === parsed.data.printer.productId
      && device.busNumber === parsed.data.printer.busNumber
      && device.deviceAddress === parsed.data.printer.deviceAddress,
    );

    if (!printer) {
      return NextResponse.json<PrintResponse>(
        { ok: false, message: '所选打印机已断开，请刷新设备列表。' },
        { status: 404 },
      );
    }

    await printTemplate(printer, validation.job, parsed.data.data);
    return NextResponse.json<PrintResponse>({ ok: true, message: '打印任务已发送。' });
  }
  catch (error) {
    return NextResponse.json<PrintResponse>(
      { ok: false, message: printerErrorMessage(error) },
      { status: 500 },
    );
  }
}
