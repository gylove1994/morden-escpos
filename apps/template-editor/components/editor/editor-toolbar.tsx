/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import type { ChangeEvent } from 'react';

import type { EditorDocument } from '../../lib/editor-types';
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

import { useRef, useState } from 'react';

import { useEditorStore } from '../../lib/editor-store';
import { importPrintJob, toPrintJob } from '../../lib/print-job';
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
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [pendingImport, setPendingImport] = useState<{ document: EditorDocument, fileName: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [exportDescription, setExportDescription] = useState('');
  const [status, setStatus] = useState('所有修改均保存在本机');

  function announce(message: string) {
    setStatus(message);
    globalThis.setTimeout(setStatus, 2500, '所有修改均保存在本机');
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const result = importPrintJob(await file.text(), document.sampleDataText);
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
            aria-label="模板名称"
            className="h-7 truncate border-transparent bg-transparent px-1 text-sm font-semibold shadow-none hover:border-border focus-visible:border-ring"
            value={document.name}
            onChange={event => updateMetadata({ name: event.target.value })}
          />
          <p className="truncate px-1 text-[10px] text-muted-foreground">Receipt Studio · ESC/POS</p>
        </div>
      </div>

      <div className="hidden h-6 w-px bg-border sm:block" />

      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" disabled={isReadOnly || pastLength === 0} aria-label="撤销" title="撤销 Ctrl/⌘ Z" onClick={undo}>
          <Undo2 aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon" disabled={isReadOnly || futureLength === 0} aria-label="重做" title="重做 Ctrl/⌘ Shift Z" onClick={redo}>
          <Redo2 aria-hidden="true" />
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <span className="hidden text-[11px] text-muted-foreground xl:block" aria-live="polite">{status}</span>
        <Select value={String(document.paperWidth)} onValueChange={value => updateDocument({ paperWidth: Number(value) as 58 | 80 })}>
          <SelectTrigger size="sm" className="w-24" aria-label="纸张宽度" disabled={isReadOnly}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="58">58 mm</SelectItem>
            <SelectItem value="80">80 mm</SelectItem>
          </SelectContent>
        </Select>
        <Select value={document.encoding} onValueChange={encoding => updateDocument({ encoding })}>
          <SelectTrigger size="sm" className="w-28 font-mono text-xs" aria-label="字符编码" disabled={isReadOnly}>
            <SelectValue placeholder="字符编码" />
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
          <span className="hidden lg:inline">输入 Schema</span>
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" accept="application/json,.json" disabled={isReadOnly} onChange={handleImport} />
        <Button type="button" variant="outline" size="sm" disabled={isReadOnly} onClick={() => fileInputRef.current?.click()}>
          <FileJson aria-hidden="true" />
          <span className="hidden sm:inline">导入</span>
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
          <span className="hidden sm:inline">导出 JSON</span>
        </Button>
        <PrinterControl />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon" disabled={isReadOnly} aria-label="恢复默认模板" title="恢复默认模板">
              <RotateCcw aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>恢复默认模板？</AlertDialogTitle>
              <AlertDialogDescription>
                当前模板会被替换。你仍可在操作后使用撤销恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                resetDocument();
                announce('已恢复默认模板');
              }}
              >
                恢复默认
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
              输入 Schema
            </DialogTitle>
            <DialogDescription>
              定义模板可使用的字段、数据类型与必填规则。保存会实时更新变量蓝/红状态。
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
            <DialogTitle>无法导入模板</DialogTitle>
            <DialogDescription>请修正以下问题后重新选择文件。</DialogDescription>
          </DialogHeader>
          <ul className="max-h-64 list-disc space-y-1 overflow-auto rounded-lg bg-destructive/8 p-4 pl-8 text-xs text-destructive">
            {importErrors.map(error => <li key={error}>{error}</li>)}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>导出模板</DialogTitle>
            <DialogDescription>可在导出前补充模板描述，留空也可以继续。</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="export-description">描述（可选）</FieldLabel>
            <Textarea
              id="export-description"
              rows={4}
              value={exportDescription}
              placeholder="说明模板适用的场景或版本"
              onChange={event => setExportDescription(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>取消</Button>
            <Button
              type="button"
              onClick={() => {
                const exportDocument = { ...document, description: exportDescription };
                updateMetadata({ description: exportDescription });
                downloadTemplate(exportDocument.name, JSON.stringify(toPrintJob(exportDocument), null, 2));
                setExportOpen(false);
                announce('模板已导出');
              }}
            >
              <Download aria-hidden="true" />
              导出 JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingImport !== null} onOpenChange={open => !open && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>导入并覆盖当前模板？</AlertDialogTitle>
            <AlertDialogDescription>
              将导入
              {' '}
              {pendingImport?.fileName}
              ，当前内容会被替换。导入后仍可使用撤销恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingImport) {
                  return;
                }
                replaceDocument(pendingImport.document);
                announce(`已导入 ${pendingImport.fileName}`);
                setPendingImport(null);
              }}
            >
              确认导入
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
