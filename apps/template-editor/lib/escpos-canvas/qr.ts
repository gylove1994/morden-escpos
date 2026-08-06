/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import QRCode from 'qrcode';

export interface QRMatrix {
  modules: boolean[][]
  size: number
}

export function createQRMatrix(
  content: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
  version?: number,
): QRMatrix {
  const qr = QRCode.create(content, {
    errorCorrectionLevel,
    ...(version === undefined ? {} : { version }),
  });
  const size = qr.modules.size;
  const modules = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => Boolean(qr.modules.get(row, column))));

  return { modules, size };
}
