/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { PrinterDescriptor } from '../../lib/printer-api';

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
import { Input } from '@workspace/ui/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/ui/select';
import { Cable, LoaderCircle, Network, Printer, RefreshCw, Usb } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useEditorStore } from '../../lib/editor-store';
import { parseSampleData, toPrintJob } from '../../lib/print-job';
import {
  classifyPrinterError,
  createTcpPrinter,
  getAuthorizedWebSerialPrinters,
  getAuthorizedWebUSBPrinters,
  isTcpPrintingSupported,
  printTemplate,
  requestWebSerialPrinter,
  requestWebUSBPrinter,
} from '../../lib/printer-client';

type Transport = PrinterDescriptor['transport'];

export function PrinterControl() {
  const t = useTranslations('Printer');
  const common = useTranslations('Common');
  const errors = useTranslations('Errors');
  const document = useEditorStore(state => state.document);
  const [open, setOpen] = useState(false);
  const [transport, setTransport] = useState<Transport>('webusb');
  const [printers, setPrinters] = useState<PrinterDescriptor[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [baudRate, setBaudRate] = useState('9600');
  const [host, setHost] = useState('');
  const [tcpPort, setTcpPort] = useState('9100');
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  function translatedPrinterError(error: unknown) {
    const result = classifyPrinterError(error);
    return result.code === 'failed'
      ? t('error.failed', { detail: result.detail ?? t('unknownError') })
      : t(`error.${result.code}`);
  }

  async function loadAuthorizedPrinters(nextTransport = transport) {
    if (nextTransport === 'tcp') {
      setPrinters([]);
      setSelectedId('');
      setMessage(isTcpPrintingSupported()
        ? t('enterLanAddress')
        : t('tcpUnsupported'));
      setIsError(!isTcpPrintingSupported());
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const result = nextTransport === 'webusb'
        ? await getAuthorizedWebUSBPrinters()
        : await getAuthorizedWebSerialPrinters(Number(baudRate));
      setPrinters(result);
      setSelectedId(current =>
        result.some(printer => printer.id === current)
          ? current
          : result[0]?.id ?? '',
      );
      if (result.length === 0) {
        setMessage(t('noAuthorized'));
      }
    }
    catch (error) {
      setPrinters([]);
      setSelectedId('');
      setIsError(true);
      setMessage(translatedPrinterError(error));
    }
    finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      void loadAuthorizedPrinters();
    }
  }

  function handleTransportChange(value: string) {
    const nextTransport = value as Transport;
    setTransport(nextTransport);
    setMessage('');
    setIsError(false);
    void loadAuthorizedPrinters(nextTransport);
  }

  function handleBaudRateChange(value: string) {
    setBaudRate(value);
    setPrinters(current => current.map(printer =>
      printer.transport === 'webserial'
        ? { ...printer, baudRate: Number(value) }
        : printer,
    ));
  }

  async function handleRequestDevice() {
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const printer = transport === 'webusb'
        ? await requestWebUSBPrinter()
        : await requestWebSerialPrinter(Number(baudRate));
      setPrinters(current => [
        ...current.filter(item => item.id !== printer.id),
        printer,
      ]);
      setSelectedId(printer.id);
      setMessage(t('authorized'));
    }
    catch (error) {
      setIsError(true);
      setMessage(translatedPrinterError(error));
    }
    finally {
      setLoading(false);
    }
  }

  async function handlePrint() {
    const port = Number(tcpPort);
    const printer = transport === 'tcp'
      ? (host.trim() && Number.isInteger(port) && port > 0
          ? createTcpPrinter(host.trim(), port)
          : undefined)
      : printers.find(item => item.id === selectedId);
    if (!printer) {
      setIsError(true);
      setMessage(transport === 'tcp'
        ? t('invalidAddress')
        : t('selectFirst'));
      return;
    }

    const sample = parseSampleData(document.sampleDataText);
    if (!sample.data) {
      setIsError(true);
      setMessage(sample.errorKey ? errors(sample.errorKey) : t('invalidSample'));
      return;
    }

    setPrinting(true);
    setMessage('');
    setIsError(false);

    try {
      await printTemplate(printer, toPrintJob(document), sample.data);
      setMessage(t('sent'));
    }
    catch (error) {
      setIsError(true);
      setMessage(translatedPrinterError(error));
    }
    finally {
      setPrinting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Printer aria-hidden="true" />
          <span className="hidden sm:inline">{t('button')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="transport-select" className="mb-1.5 block text-xs font-medium">{t('transport')}</label>
            <Select value={transport} onValueChange={handleTransportChange} disabled={printing}>
              <SelectTrigger id="transport-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webusb">
                  <Usb aria-hidden="true" />
                  USB
                </SelectItem>
                <SelectItem value="webserial">
                  <Cable aria-hidden="true" />
                  {t('serial')}
                </SelectItem>
                <SelectItem value="tcp">
                  <Network aria-hidden="true" />
                  {t('network')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transport === 'webserial'
            ? (
                <div>
                  <label htmlFor="baud-rate" className="mb-1.5 block text-xs font-medium">{t('baudRate')}</label>
                  <Select value={baudRate} onValueChange={handleBaudRateChange} disabled={loading || printing}>
                    <SelectTrigger id="baud-rate" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9600">9600</SelectItem>
                      <SelectItem value="19200">19200</SelectItem>
                      <SelectItem value="38400">38400</SelectItem>
                      <SelectItem value="115200">115200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )
            : null}

          {transport === 'tcp'
            ? (
                <div className="grid grid-cols-[1fr_7rem] gap-2">
                  <div>
                    <label htmlFor="printer-host" className="mb-1.5 block text-xs font-medium">{t('host')}</label>
                    <Input
                      id="printer-host"
                      value={host}
                      placeholder="192.168.1.100"
                      onChange={event => setHost(event.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="printer-port" className="mb-1.5 block text-xs font-medium">{t('port')}</label>
                    <Input
                      id="printer-port"
                      inputMode="numeric"
                      value={tcpPort}
                      onChange={event => setTcpPort(event.target.value)}
                    />
                  </div>
                </div>
              )
            : (
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="printer-select" className="mb-1.5 block text-xs font-medium">{t('printer')}</label>
                    <Select value={selectedId} onValueChange={setSelectedId} disabled={loading || printers.length === 0}>
                      <SelectTrigger id="printer-select" className="w-full">
                        <SelectValue placeholder={loading ? t('detecting') : t('selectPrinter')} />
                      </SelectTrigger>
                      <SelectContent>
                        {printers.map(printer => (
                          <SelectItem key={printer.id} value={printer.id}>
                            {printer.transport === 'webusb'
                              ? <Usb aria-hidden="true" />
                              : <Cable aria-hidden="true" />}
                            {printer.label}
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
                    aria-label={t('refresh')}
                    onClick={() => void loadAuthorizedPrinters()}
                  >
                    <span className={loading ? 'animate-spin' : ''}>
                      <RefreshCw aria-hidden="true" />
                    </span>
                  </Button>
                  <Button type="button" variant="outline" disabled={loading} onClick={() => void handleRequestDevice()}>
                    {t('selectDevice')}
                  </Button>
                </div>
              )}

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
            {t('help')}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>{common('cancel')}</Button>
          <Button
            type="button"
            disabled={(transport !== 'tcp' && !selectedId) || loading || printing}
            onClick={() => void handlePrint()}
          >
            {printing
              ? (
                  <span className="animate-spin">
                    <LoaderCircle aria-hidden="true" />
                  </span>
                )
              : <Printer aria-hidden="true" />}
            {printing ? t('printing') : t('send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
