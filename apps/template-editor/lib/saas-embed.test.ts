/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from 'vitest';
import { isSaasEmbedMessage, SAAS_EMBED_CHANNEL } from './saas-embed';

describe('saas embed protocol', () => {
  it('accepts channel-tagged host and editor messages', () => {
    expect(isSaasEmbedMessage({
      channel: SAAS_EMBED_CHANNEL,
      type: 'saas:ready',
    })).toBe(true);
    expect(isSaasEmbedMessage({
      channel: SAAS_EMBED_CHANNEL,
      type: 'saas:load',
      templateId: 't1',
      name: 'Receipt',
      definition: { commands: [{ type: 'text', content: 'Hi' }] },
    })).toBe(true);
  });

  it('rejects unrelated postMessage payloads', () => {
    expect(isSaasEmbedMessage({ type: 'saas:ready' })).toBe(false);
    expect(isSaasEmbedMessage(null)).toBe(false);
    expect(isSaasEmbedMessage('saas:ready')).toBe(false);
  });
});
