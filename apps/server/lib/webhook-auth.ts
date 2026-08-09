/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */
import {
  authenticateWebhookSharedSecret,
  authenticateWebhookSignedRequest,
  type WebhookSigningSecretPublic,
} from './webhook-secret';

export type WebhookAuthResult
  = | { ok: true, webhookSecret: WebhookSigningSecretPublic }
    | { ok: false, response: Response };

function parseSignatureHeader(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  const match = /^sha256=([0-9a-fA-F]+)$/.exec(trimmed);
  return match?.[1]?.toLowerCase() ?? null;
}

/**
 * Authenticate a webhook enqueue request.
 *
 * Supported modes (either is sufficient):
 * 1. Shared secret: `X-Webhook-Secret: whsec_…`
 * 2. Signed request: `X-Webhook-Id` + `X-Webhook-Timestamp` +
 *    `X-Webhook-Signature: sha256=<hmac>` over `${timestamp}.${rawBody}`
 *
 * Device tokens and integrator API keys MUST NOT authenticate here.
 */
export async function requireWebhookAuth(
  request: Request,
  rawBody: string,
): Promise<WebhookAuthResult> {
  const webhookId = request.headers.get('x-webhook-id')?.trim() || null;
  const timestamp = request.headers.get('x-webhook-timestamp')?.trim() || null;
  const signatureHex = parseSignatureHeader(request.headers.get('x-webhook-signature'));
  const sharedSecret = request.headers.get('x-webhook-secret')?.trim() || null;

  const wantsSigned = Boolean(webhookId || timestamp || signatureHex);

  if (wantsSigned) {
    if (!webhookId || !timestamp || !signatureHex) {
      return {
        ok: false,
        response: Response.json(
          {
            error: 'unauthorized',
            message:
              'Signed webhook requires X-Webhook-Id, X-Webhook-Timestamp, and X-Webhook-Signature',
          },
          { status: 401 },
        ),
      };
    }

    const webhookSecret = await authenticateWebhookSignedRequest({
      webhookSecretId: webhookId,
      timestamp,
      signatureHex,
      rawBody,
    });

    if (!webhookSecret) {
      return {
        ok: false,
        response: Response.json(
          {
            error: 'unauthorized',
            message: 'Invalid webhook signature or expired timestamp',
          },
          { status: 401 },
        ),
      };
    }

    return { ok: true, webhookSecret };
  }

  if (!sharedSecret) {
    return {
      ok: false,
      response: Response.json(
        {
          error: 'unauthorized',
          message:
            'Webhook auth required (X-Webhook-Secret or signed X-Webhook-Signature)',
        },
        { status: 401 },
      ),
    };
  }

  const webhookSecret = await authenticateWebhookSharedSecret(sharedSecret);
  if (!webhookSecret) {
    return {
      ok: false,
      response: Response.json(
        {
          error: 'unauthorized',
          message: 'Invalid or revoked webhook secret',
        },
        { status: 401 },
      ),
    };
  }

  return { ok: true, webhookSecret };
}
