/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
const HTTP_IMAGE_URL = /^https?:\/\//i;

export function isRemoteImagePath(path: string): boolean {
  return HTTP_IMAGE_URL.test(path);
}
