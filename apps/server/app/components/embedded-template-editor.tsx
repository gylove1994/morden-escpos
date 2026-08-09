/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
'use client';

import { useEffect, useRef, useState } from 'react';

type PrinterOption = {
  id: string
  name: string
  status: string
};

type PrinterGroupOption = {
  id: string
  name: string
  printerIds: string[]
};

type TemplateDetail = {
  id: string
  name: string
  definition: unknown
};

type EditorDocumentMessage = {
  channel: 'morden-escpos-saas-embed'
  type: 'saas:document'
  requestId?: string
  templateId: string | null
  name: string
  definition: unknown
  sampleDataText: string
  inputs: Record<string, unknown>
};

type Props = {
  template: TemplateDetail
  editorOrigin: string
  printers: PrinterOption[]
  printerGroups: PrinterGroupOption[]
  canManage: boolean
};

const EMBED_CHANNEL = 'morden-escpos-saas-embed';

function editorEmbedUrl(origin: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/en?embed=saas`;
}

export function EmbeddedTemplateEditor({
  template,
  editorOrigin,
  printers,
  printerGroups,
  canManage,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [targetKind, setTargetKind] = useState<'printer' | 'group'>(
    printers.some(p => p.status === 'active') ? 'printer' : 'group',
  );
  const [printerId, setPrinterId] = useState(
    printers.find(p => p.status === 'active')?.id ?? '',
  );
  const [printerGroupId, setPrinterGroupId] = useState(
    printerGroups[0]?.id ?? '',
  );
  const [name, setName] = useState(template.name);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);
  const pendingRequests = useRef(new Map<string, {
    resolve: (value: EditorDocumentMessage) => void
    reject: (reason?: unknown) => void
  }>());

  const activePrinters = printers.filter(p => p.status === 'active');
  const canConfirm = targetKind === 'printer'
    ? printerId.length > 0
    : printerGroupId.length > 0;

  function postToEditor(message: Record<string, unknown>) {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage({ channel: EMBED_CHANNEL, ...message }, editorOrigin);
  }

  function requestDocument(): Promise<EditorDocumentMessage> {
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      pendingRequests.current.set(requestId, { resolve, reject });
      postToEditor({ type: 'saas:request-document', requestId });
      window.setTimeout(() => {
        if (pendingRequests.current.has(requestId)) {
          pendingRequests.current.delete(requestId);
          reject(new Error('Timed out waiting for editor document'));
        }
      }, 8_000);
    });
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== editorOrigin) return;
      const data = event.data as {
        channel?: string
        type?: string
        requestId?: string
        message?: string
      };
      if (!data || data.channel !== EMBED_CHANNEL) return;

      if (data.type === 'saas:ready') {
        setEditorReady(true);
        postToEditor({
          type: 'saas:load',
          templateId: template.id,
          name: template.name,
          definition: template.definition,
          sampleDataText: '{}',
        });
        return;
      }

      if (data.type === 'saas:document') {
        const doc = data as EditorDocumentMessage;
        const pending = doc.requestId
          ? pendingRequests.current.get(doc.requestId)
          : undefined;
        if (pending && doc.requestId) {
          pendingRequests.current.delete(doc.requestId);
          pending.resolve(doc);
        }
        return;
      }

      if (data.type === 'saas:error') {
        const pending = data.requestId
          ? pendingRequests.current.get(data.requestId)
          : undefined;
        if (pending && data.requestId) {
          pendingRequests.current.delete(data.requestId);
          pending.reject(new Error(data.message ?? 'Editor error'));
        }
        else {
          setError(data.message ?? 'Editor error');
        }
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [editorOrigin, template.definition, template.id, template.name]);

  async function onSave() {
    if (!canManage) return;
    setPendingSave(true);
    setError(null);
    setStatus(null);
    try {
      const doc = await requestDocument();
      const response = await fetch(`/api/console/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || doc.name,
          definition: doc.definition,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string };
        setError(body.message ?? 'Could not save template');
        return;
      }
      setStatus('Template saved to Organization');
      setName(name.trim() || doc.name);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save template');
    }
    finally {
      setPendingSave(false);
    }
  }

  async function onConfirmationPrint() {
    if (!canConfirm) {
      setError('Select a Printer or Printer Group before confirmation print');
      return;
    }
    setPendingPrint(true);
    setError(null);
    setStatus(null);
    try {
      if (canManage) {
        // Persist latest definition so server-side render matches the canvas.
        const doc = await requestDocument();
        const saveResponse = await fetch(`/api/console/templates/${template.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || doc.name,
            definition: doc.definition,
          }),
        });
        if (!saveResponse.ok) {
          const body = await saveResponse.json().catch(() => ({})) as { message?: string };
          setError(body.message ?? 'Could not save template before confirmation print');
          return;
        }

        const enqueueResponse = await fetch('/api/console/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(targetKind === 'printer'
              ? { printerId }
              : { printerGroupId }),
            templateId: template.id,
            inputs: doc.inputs,
            purpose: 'template_confirmation',
          }),
        });
        if (!enqueueResponse.ok) {
          const body = await enqueueResponse.json().catch(() => ({})) as {
            error?: string
            message?: string
          };
          setError(body.message ?? 'Could not enqueue confirmation print');
          return;
        }
        const body = await enqueueResponse.json() as {
          job: { id: string, purpose: string }
          children?: unknown[]
        };
        setStatus(
          `Confirmation job ${body.job.id} enqueued (${body.job.purpose})`
          + (body.children?.length ? ` with ${body.children.length} children` : ''),
        );
      }
      else {
        // Members cannot mutate templates; enqueue the stored definition as-is.
        const doc = await requestDocument();
        const enqueueResponse = await fetch('/api/console/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(targetKind === 'printer'
              ? { printerId }
              : { printerGroupId }),
            templateId: template.id,
            inputs: doc.inputs,
            purpose: 'template_confirmation',
          }),
        });
        if (!enqueueResponse.ok) {
          const body = await enqueueResponse.json().catch(() => ({})) as { message?: string };
          setError(body.message ?? 'Could not enqueue confirmation print');
          return;
        }
        const body = await enqueueResponse.json() as { job: { id: string, purpose: string } };
        setStatus(`Confirmation job ${body.job.id} enqueued (${body.job.purpose})`);
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation print failed');
    }
    finally {
      setPendingPrint(false);
    }
  }

  return (
    <div className="stack">
      <div className="org-form">
        <label>
          Template name
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            disabled={!canManage}
            maxLength={120}
          />
        </label>
        <label>
          Confirmation target
          <select
            value={targetKind}
            onChange={event => setTargetKind(event.target.value as 'printer' | 'group')}
          >
            <option value="printer">Printer</option>
            <option value="group">Printer Group</option>
          </select>
        </label>
        {targetKind === 'printer'
          ? (
              <label>
                Printer
                <select
                  value={printerId}
                  onChange={event => setPrinterId(event.target.value)}
                  required
                >
                  <option value="">Select a Printer…</option>
                  {activePrinters.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
            )
          : (
              <label>
                Printer Group
                <select
                  value={printerGroupId}
                  onChange={event => setPrinterGroupId(event.target.value)}
                  required
                >
                  <option value="">Select a Printer Group…</option>
                  {printerGroups.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {' '}
                      (
                      {item.printerIds.length}
                      {' '}
                      members)
                    </option>
                  ))}
                </select>
              </label>
            )}
        <div className="agent-actions">
          {canManage
            ? (
                <button
                  type="button"
                  onClick={() => void onSave()}
                  disabled={pendingSave || !editorReady}
                >
                  {pendingSave ? 'Saving…' : 'Save to Organization'}
                </button>
              )
            : null}
          <button
            type="button"
            onClick={() => void onConfirmationPrint()}
            disabled={pendingPrint || !editorReady || !canConfirm}
          >
            {pendingPrint ? 'Enqueueing…' : 'Confirmation print'}
          </button>
          <a className="secondary" href="/console/jobs">Job history</a>
        </div>
        {!canConfirm
          ? (
              <p className="muted" role="status">
                Select a Printer or Printer Group before confirmation print.
              </p>
            )
          : null}
        {error ? <p className="error" role="alert">{error}</p> : null}
        {status ? <p className="muted" role="status">{status}</p> : null}
        <p className="muted">
          In-browser preview runs locally inside Receipt Studio (no enqueue).
          Confirmation print uses the formal queue after server-side render.
        </p>
      </div>

      <iframe
        ref={iframeRef}
        title="Receipt Studio template editor"
        src={editorEmbedUrl(editorOrigin)}
        className="template-editor-frame"
        allow="usb; serial"
      />
    </div>
  );
}
