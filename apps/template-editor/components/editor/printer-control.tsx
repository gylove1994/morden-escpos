'use client';

import type { PrintersResponse, PrintResponse } from '../../lib/printer-api';

import { Button } from '@workspace/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/ui/dialog';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/ui/select';
import { LoaderCircle, Printer, RefreshCw, Usb } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useEditorStore } from '../../lib/editor-store';
import { parseSampleData, toPrintJob } from '../../lib/print-job';

export function PrinterControl() {
  const document = useEditorStore(state => state.document);
  const [open, setOpen] = useState(false);
  const [printers, setPrinters] = useState<PrintersResponse['printers']>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function loadPrinters(signal?: AbortSignal) {
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const requestInit: RequestInit = { cache: 'no-store' };
      if (signal) {
        requestInit.signal = signal;
      }
      const response = await fetch('/api/printers', requestInit);
      const result = await response.json() as PrintersResponse;
      if (!response.ok) {
        throw new Error(result.error ?? '无法识别打印机。');
      }
      setPrinters(result.printers);
      setSelectedId(current =>
        result.printers.some(printer => printer.id === current)
          ? current
          : result.printers[0]?.id ?? '',
      );
      if (result.printers.length === 0) {
        setMessage('没有发现 USB ESC/POS 打印机，请检查连接和系统权限。');
      }
    }
    catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setPrinters([]);
      setSelectedId('');
      setIsError(true);
      setMessage(error instanceof Error ? error.message : '无法识别打印机。');
    }
    finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    const controller = new AbortController();
    void loadPrinters(controller.signal);
    return () => controller.abort();
  }, [open]);

  async function handlePrint() {
    const printer = printers.find(item => item.id === selectedId);
    if (!printer) {
      setIsError(true);
      setMessage('请先选择一台可用打印机。');
      return;
    }

    const sample = parseSampleData(document.sampleDataText);
    if (!sample.data) {
      setIsError(true);
      setMessage(sample.error ?? '示例数据无效。');
      return;
    }

    setPrinting(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printer,
          template: toPrintJob(document),
          data: sample.data,
        }),
      });
      const result = await response.json() as PrintResponse;
      setIsError(!response.ok || !result.ok);
      setMessage(result.message);
    }
    catch {
      setIsError(true);
      setMessage('无法连接本机打印服务，请确认 Next.js 服务仍在运行。');
    }
    finally {
      setPrinting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Printer aria-hidden="true" />
          <span className="hidden sm:inline">打印</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>打印小票</DialogTitle>
          <DialogDescription>
            识别连接到当前 Next.js 主机的 USB ESC/POS 打印机。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="printer-select" className="mb-1.5 block text-xs font-medium">打印机</label>
              <Select value={selectedId} onValueChange={setSelectedId} disabled={loading || printers.length === 0}>
                <SelectTrigger id="printer-select" className="w-full">
                  <SelectValue placeholder={loading ? '正在识别…' : '选择打印机'} />
                </SelectTrigger>
                <SelectContent>
                  {printers.map(printer => (
                    <SelectItem key={printer.id} value={printer.id}>
                      <Usb aria-hidden="true" />
                      {printer.label}
                      {' · '}
                      总线
                      {printer.busNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={loading}
              aria-label="重新识别打印机"
              onClick={() => void loadPrinters()}
            >
              <span className={loading ? 'animate-spin' : ''}>
                <RefreshCw aria-hidden="true" />
              </span>
            </Button>
          </div>

          {message
            ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={`rounded-lg border px-3 py-2 text-xs leading-5 ${
                    isError
                      ? 'border-destructive/25 bg-destructive/8 text-destructive'
                      : 'border-primary/20 bg-primary/7 text-foreground'
                  }`}
                >
                  {message}
                </div>
              )
            : null}

          <p className="text-[11px] leading-5 text-muted-foreground">
            打印发生在运行 Next.js 的这台电脑上。云端部署无法直接访问门店 USB 设备。
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
          <Button type="button" disabled={!selectedId || loading || printing} onClick={() => void handlePrint()}>
            {printing
              ? (
                  <span className="animate-spin">
                    <LoaderCircle aria-hidden="true" />
                  </span>
                )
              : <Printer aria-hidden="true" />}
            {printing ? '正在打印…' : '发送打印任务'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
