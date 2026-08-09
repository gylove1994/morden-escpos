/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
'use client';

import { useEffect, useRef } from 'react';
import {
  isSaasEmbedMessage,
  isSaasEmbedMode,
  SAAS_EMBED_CHANNEL,
  type SaasEmbedHostToEditor,
} from '../../lib/saas-embed';
import { useEditorStore } from '../../lib/editor-store';
import { importPrintJob, parseSampleData, toPrintJob } from '../../lib/print-job';

/**
 * Host bridge for SaaS iframe embed.
 * Loads org templates from the parent and returns the current PrintJobJSON
 * definition for save / confirmation enqueue. Preview stays local in-editor.
 */
export function SaasEmbedBridge() {
  const replaceDocument = useEditorStore(state => state.replaceDocument);
  const document = useEditorStore(state => state.document);
  const templateIdRef = useRef<string | null>(null);
  const enabled = isSaasEmbedMode();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function post(message: Record<string, unknown>) {
      if (window.parent === window) {
        return;
      }
      window.parent.postMessage({ channel: SAAS_EMBED_CHANNEL, ...message }, '*');
    }

    function handleLoad(message: Extract<SaasEmbedHostToEditor, { type: 'saas:load' }>) {
      templateIdRef.current = message.templateId;
      const imported = importPrintJob(
        JSON.stringify(message.definition),
        message.sampleDataText ?? '{}',
        message.name,
      );
      if (!imported.document) {
        post({
          type: 'saas:error',
          message: 'Host template definition could not be imported',
        });
        return;
      }
      replaceDocument({
        ...imported.document,
        name: message.name || imported.document.name,
      }, false);
    }

    function handleRequestDocument(requestId: string) {
      const current = useEditorStore.getState().document;
      const validation = toPrintJob(current);
      const sample = parseSampleData(current.sampleDataText);
      post({
        type: 'saas:document',
        requestId,
        templateId: templateIdRef.current,
        name: current.name,
        definition: validation,
        sampleDataText: current.sampleDataText,
        inputs: sample.data ?? {},
      });
    }

    function onMessage(event: MessageEvent) {
      const data: unknown = event.data;
      if (!isSaasEmbedMessage(data)) {
        return;
      }
      if (data.type === 'saas:load') {
        handleLoad(data);
        return;
      }
      if (data.type === 'saas:request-document') {
        handleRequestDocument(data.requestId);
      }
    }

    window.addEventListener('message', onMessage);
    post({ type: 'saas:ready' });
    return () => window.removeEventListener('message', onMessage);
  }, [enabled, replaceDocument]);

  // Keep a cheap subscription so the bridge remounts stay tied to document edits.
  void document.name;

  if (!enabled) {
    return null;
  }

  return (
    <div className="border-b bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground" role="status">
      SaaS embed — in-browser preview is local; confirmation print is handled by the console host.
    </div>
  );
}
