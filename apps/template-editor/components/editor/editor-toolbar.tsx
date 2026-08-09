/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { ChangeEvent } from 'react';

import type { EditorDocument, UserMessage } from '../../lib/editor-types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/ui/alert-dialog';

import { Button } from '@workspace/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { Field, FieldLabel } from '@workspace/ui/components/ui/field';
import { Input } from '@workspace/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/ui/select';
import { Textarea } from '@workspace/ui/components/ui/textarea';
import { Braces, Download, FileJson, Redo2, RotateCcw, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRef, useState } from 'react';

import { useEditorStore } from '../../lib/editor-store';
import { importPrintJob, toPrintJob } from '../../lib/print-job';
import { LocaleSwitcher } from '../i18n/locale-switcher';
import { InputSchemaBuilder } from './input-schema-builder';
import { PrinterControl } from './printer-control';

const encodingOptions = ['GB18030', 'GBK', 'UTF-8'];

function downloadTemplate(name: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = globalThis.document.createElement('a');
  const safeName = name.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-') || 'receipt-template';
  anchor.href = url;
  anchor.download = `${safeName}.json`;
  anchor.hidden = true;
  globalThis.document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function EditorToolbar() {
  const t = useTranslations('Toolbar');
  const common = useTranslations('Common');
  const errors = useTranslations('Errors');
  const document = useEditorStore(state => state.document);
  const isReadOnly = useEditorStore(state => state.viewMode === 'printPreview');
  const pastLength = useEditorStore(state => state.past.length);
  const futureLength = useEditorStore(state => state.future.length);
  const updateDocument = useEditorStore(state => state.updateDocument);
  const updateMetadata = useEditorStore(state => state.updateMetadata);
  const replaceDocument = useEditorStore(state => state.replaceDocument);
  const resetDocument = useEditorStore(state => state.resetDocument);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<UserMessage[]>([]);
  const [pendingImport, setPendingImport] = useState<{ document: EditorDocument, fileName: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [exportDescription, setExportDescription] = useState('');
  const [status, setStatus] = useState('');

  function announce(message: string) {
    setStatus(message);
    globalThis.setTimeout(setStatus, 2500, '');
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const result = importPrintJob(await file.text(), document.sampleDataText, t('untitled'));
    if (!result.document) {
      setImportErrors(result.errors);
      return;
    }

    setPendingImport({ document: result.document, fileName: file.name });
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 md:px-4">
      <div className="mr-2 flex min-w-0 items-center gap-2 md:w-72">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
          R
        </div>
        <div className="min-w-0">
          <Input
            aria-label={t('templateName')}
            className="h-7 truncate border-transparent bg-transparent px-1 text-sm font-semibold shadow-none hover:border-border focus-visible:border-ring"
            value={document.name}
            onChange={event => updateMetadata({ name: event.target.value })}
          />
          <p className="truncate px-1 text-[10px] text-muted-foreground">Receipt Studio · ESC/POS</p>
        </div>
      </div>

      <div className="hidden h-6 w-px bg-border sm:block" />

      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" disabled={isReadOnly || pastLength === 0} aria-label={t('undo')} title={t('undoTitle')} onClick={undo}>
          <Undo2 aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon" disabled={isReadOnly || futureLength === 0} aria-label={t('redo')} title={t('redoTitle')} onClick={redo}>
          <Redo2 aria-hidden="true" />
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <span className="hidden text-[11px] text-muted-foreground xl:block" aria-live="polite">{status || t('savedLocally')}</span>
        <LocaleSwitcher />
        <Select value={String(document.paperWidth)} onValueChange={value => updateDocument({ paperWidth: Number(value) as 58 | 80 })}>
          <SelectTrigger size="sm" className="w-24" aria-label={t('paperWidth')} disabled={isReadOnly}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="58">58 mm</SelectItem>
            <SelectItem value="80">80 mm</SelectItem>
          </SelectContent>
        </Select>
        <Select value={document.encoding} onValueChange={encoding => updateDocument({ encoding })}>
          <SelectTrigger size="sm" className="w-28 font-mono text-xs" aria-label={t('encoding')} disabled={isReadOnly}>
            <SelectValue placeholder={t('encoding')} />
          </SelectTrigger>
          <SelectContent>
            {encodingOptions.map(encoding => (
              <SelectItem key={encoding} value={encoding}>{encoding}</SelectItem>
            ))}
            {document.encoding && !encodingOptions.includes(document.encoding)
              ? <SelectItem value={document.encoding}>{document.encoding}</SelectItem>
              : null}
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" size="sm" disabled={isReadOnly} onClick={() => setSchemaOpen(true)}>
          <Braces aria-hidden="true" />
          <span className="hidden lg:inline">{t('inputSchema')}</span>
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" accept="application/json,.json" disabled={isReadOnly} onChange={handleImport} />
        <Button type="button" variant="outline" size="sm" disabled={isReadOnly} onClick={() => fileInputRef.current?.click()}>
          <FileJson aria-hidden="true" />
          <span className="hidden sm:inline">{t('import')}</span>
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => {
            setExportDescription(document.description);
            setExportOpen(true);
          }}
        >
          <Download aria-hidden="true" />
          <span className="hidden sm:inline">{t('exportJson')}</span>
        </Button>
        <PrinterControl />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon" disabled={isReadOnly} aria-label={t('reset')} title={t('reset')}>
              <RotateCcw aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('resetTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('resetDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{common('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                resetDocument();
                announce(t('resetDone'));
              }}
              >
                {t('resetAction')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Dialog open={schemaOpen} onOpenChange={setSchemaOpen}>
        <DialogContent className="top-0! left-0! flex h-dvh w-screen max-w-none! translate-x-0! translate-y-0! flex-col gap-0 rounded-none! p-0! sm:max-w-none!">
          <DialogHeader className="shrink-0 border-b px-5 py-4 pr-14">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Braces className="size-5 text-primary" aria-hidden="true" />
              {t('inputSchema')}
            </DialogTitle>
            <DialogDescription>
              {t('schemaDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 bg-muted/20 p-4 md:p-6">
            <div className="mx-auto h-full max-w-360">
              <InputSchemaBuilder
                fill
                value={document.inputSchema}
                onChange={inputSchema => updateDocument({ inputSchema })}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importErrors.length > 0} onOpenChange={open => !open && setImportErrors([])}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('importErrorTitle')}</DialogTitle>
            <DialogDescription>{t('importErrorDescription')}</DialogDescription>
          </DialogHeader>
          <ul className="max-h-64 list-disc space-y-1 overflow-auto rounded-lg bg-destructive/8 p-4 pl-8 text-xs text-destructive">
            {importErrors.map(error => (
              <li key={`${error.key}-${JSON.stringify(error.values)}`}>{errors(error.key, error.values)}</li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('exportTitle')}</DialogTitle>
            <DialogDescription>{t('exportDescription')}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="export-description">{t('descriptionOptional')}</FieldLabel>
            <Textarea
              id="export-description"
              rows={4}
              value={exportDescription}
              placeholder={t('descriptionPlaceholder')}
              onChange={event => setExportDescription(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>{common('cancel')}</Button>
            <Button
              type="button"
              onClick={() => {
                const exportDocument = { ...document, description: exportDescription };
                updateMetadata({ description: exportDescription });
                downloadTemplate(exportDocument.name, JSON.stringify(toPrintJob(exportDocument), null, 2));
                setExportOpen(false);
                announce(t('exportDone'));
              }}
            >
              <Download aria-hidden="true" />
              {t('exportJson')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingImport !== null} onOpenChange={open => !open && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmImportTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmImportDescription', { fileName: pendingImport?.fileName ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingImport) {
                  return;
                }
                replaceDocument(pendingImport.document);
                announce(t('importDone', { fileName: pendingImport.fileName }));
                setPendingImport(null);
              }}
            >
              {t('confirmImport')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
