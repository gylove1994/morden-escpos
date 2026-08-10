/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { DeepPartial, Localization } from '@better-auth-ui/core';

/**
 * Injectable auth copy overlays for Better Auth UI.
 *
 * Production console locale catalogs live in the SaaS app and are passed in
 * here. The UI package MUST NOT own the production en/zh source of truth.
 */
export type AuthMessages = DeepPartial<Localization>;

/**
 * Builds a `localization` value for `AuthProvider` from an injected message
 * overlay (typically console locale catalogs).
 */
export function createAuthLocalization(messages: AuthMessages): AuthMessages {
  return messages;
}
