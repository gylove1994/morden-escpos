import type { PaperWidth } from '../editor-types';

export const DOTS_PER_COLUMN = 12;
export const FONT_HEIGHT = 24;
export const RECEIPT_VERTICAL_PADDING = 24;

export interface PaperMetrics {
  columns: number
  dots: number
}

const PAPER_METRICS: Record<PaperWidth, PaperMetrics> = {
  58: { columns: 32, dots: 384 },
  80: { columns: 48, dots: 576 },
};

export function getPaperMetrics(paperWidth: PaperWidth): PaperMetrics {
  return PAPER_METRICS[paperWidth];
}
