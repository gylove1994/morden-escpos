import type { TableCustomCommand } from 'morden-node-escpos/schema';

import { describe, expect, it } from 'vitest';

import { formatTableCustom, textLength, textSubstring } from './layout';

describe('esc/pos layout helpers', () => {
  it('counts fullwidth characters as two columns', () => {
    expect(textLength('AB咖啡')).toBe(6);
    expect(textSubstring('AB咖啡', 0, 4)).toBe('AB咖');
    expect(textSubstring('AB咖啡', 4)).toBe('啡');
  });

  it('lays out custom tables using configured columns and alignment', () => {
    const command: TableCustomCommand = {
      type: 'tableCustom',
      data: [
        { text: '咖啡', cols: 16, align: 'LEFT' },
        { text: 'x2', cols: 6, align: 'CENTER' },
        { text: '￥36', cols: 10, align: 'RIGHT' },
      ],
      options: { size: [1, 1], encoding: 'GB18030' },
    };

    const [line] = formatTableCustom(command, 32);

    expect(textLength(line ?? '')).toBe(32);
    expect(line).toContain('咖啡');
    expect(line?.endsWith('￥36')).toBe(true);
  });

  it('wraps text that exceeds a custom table cell', () => {
    const command: TableCustomCommand = {
      type: 'tableCustom',
      data: [
        { text: '超长商品名称', cols: 8, align: 'LEFT' },
        { text: '12.00', cols: 8, align: 'RIGHT' },
      ],
      options: { size: [1, 1], encoding: 'GB18030' },
    };

    const lines = formatTableCustom(command, 16);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every(line => textLength(line) === 16)).toBe(true);
  });
});
