import type { TableCustomCommand } from 'morden-node-escpos/schema';

export function charLength(character: string): number {
  const codePoint = character.codePointAt(0) ?? 0;
  return codePoint > 0x7F ? 2 : 1;
}

export function textLength(text: string): number {
  let length = 0;
  for (const character of text) {
    length += charLength(character);
  }
  return length;
}

export function textSubstring(text: string, start: number, end?: number): string {
  let position = 0;
  let result = '';

  for (const character of text) {
    const nextPosition = position + charLength(character);
    if (nextPosition > start && (end === undefined || nextPosition <= end)) {
      result += character;
    }
    position = nextPosition;
  }

  return result;
}

function fitCell(text: string, columns: number, align: string): { line: string, rest: string } {
  const visible = textSubstring(text, 0, columns);
  const visibleLength = textLength(visible);
  const remaining = textSubstring(text, columns);
  const padding = Math.max(0, columns - visibleLength);
  const normalizedAlign = align.toUpperCase();

  if (normalizedAlign === 'RIGHT') {
    return { line: `${' '.repeat(padding)}${visible}`, rest: remaining };
  }
  if (normalizedAlign === 'CENTER') {
    const left = Math.floor(padding / 2);
    return {
      line: `${' '.repeat(left)}${visible}${' '.repeat(padding - left)}`,
      rest: remaining,
    };
  }
  return { line: `${visible}${' '.repeat(padding)}`, rest: remaining };
}

export function formatTable(data: (string | number)[], columns: number): string {
  if (data.length === 0) {
    return '';
  }

  const cellWidth = Math.floor(columns / data.length);
  return data
    .map(value => fitCell(String(value), cellWidth, 'LEFT').line)
    .join('')
    .padEnd(columns);
}

export function formatTableCustom(
  command: TableCustomCommand,
  printerColumns: number,
): string[] {
  if (command.data.length === 0) {
    return [];
  }

  const widthScale = Math.max(1, command.options?.size[0] ?? 1);
  const usableColumns = Math.floor(printerColumns / widthScale);
  const defaultCellWidth = Math.floor(usableColumns / command.data.length);
  const configuredWidths = command.data.map((cell) => {
    if ('cols' in cell && cell.cols !== undefined) {
      return Math.max(1, Math.floor(cell.cols / widthScale));
    }
    if ('width' in cell && cell.width !== undefined) {
      return Math.max(1, Math.floor(usableColumns * cell.width));
    }
    return defaultCellWidth;
  });

  const configuredTotal = configuredWidths.reduce((sum, width) => sum + width, 0);
  if (configuredTotal < usableColumns) {
    configuredWidths[configuredWidths.length - 1]! += usableColumns - configuredTotal;
  }

  let remaining = command.data.map(cell => cell.text);
  const lines: string[] = [];

  do {
    const nextRemaining: string[] = [];
    const cells = remaining.map((text, index) => {
      const cell = command.data[index]!;
      const fitted = fitCell(text, configuredWidths[index]!, cell.align ?? 'LEFT');
      nextRemaining.push(fitted.rest);
      return fitted.line;
    });
    lines.push(cells.join('').slice(0, usableColumns));
    remaining = nextRemaining;
  } while (remaining.some(Boolean));

  return lines;
}

export function normalizeCurrencySymbol(content: string, encoding: string): string {
  if (!/gbk|gb2312|gb18030|cp936/i.test(encoding)) {
    return content;
  }
  return content.replaceAll('\u00A5', '\uFFE5');
}
