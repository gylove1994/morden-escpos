/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * postMessage protocol between the MIT Receipt Studio editor (iframe) and a
 * SaaS console host. Standalone local use does not enable this bridge.
 */

export const SAAS_EMBED_CHANNEL = 'morden-escpos-saas-embed' as const;

export type SaasEmbedHostToEditor
  = | {
    channel: typeof SAAS_EMBED_CHANNEL
    type: 'saas:load'
    templateId: string
    name: string
    definition: unknown
    sampleDataText?: string
  }
  | {
    channel: typeof SAAS_EMBED_CHANNEL
    type: 'saas:request-document'
    requestId: string
  };

export type SaasEmbedEditorToHost
  = | {
    channel: typeof SAAS_EMBED_CHANNEL
    type: 'saas:ready'
  }
  | {
    channel: typeof SAAS_EMBED_CHANNEL
    type: 'saas:document'
    requestId?: string
    templateId: string | null
    name: string
    definition: unknown
    sampleDataText: string
    inputs: Record<string, unknown>
  }
  | {
    channel: typeof SAAS_EMBED_CHANNEL
    type: 'saas:error'
    requestId?: string
    message: string
  };

export function isSaasEmbedMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('embed') === 'saas';
}

export function isSaasEmbedMessage(value: unknown): value is SaasEmbedHostToEditor | SaasEmbedEditorToHost {
  return (
    typeof value === 'object'
    && value !== null
    && (value as { channel?: unknown }).channel === SAAS_EMBED_CHANNEL
    && typeof (value as { type?: unknown }).type === 'string'
  );
}
