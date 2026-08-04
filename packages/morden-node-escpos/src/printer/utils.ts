import { Buffer } from 'node:buffer';

/**
 * [getParityBit description]
 * @return {[type]} [description]
 */
export function getParityBit(str: string) {
  let parity = 0;
  const reversedCode = str.split('').reverse().join('');
  for (let counter = 0; counter < reversedCode.length; counter += 1) {
    parity += Number.parseInt(reversedCode.charAt(counter), 10) * 3 ** ((counter + 1) % 2);
  }
  return ((10 - (parity % 10)) % 10).toString();
}

export function codeLength(str: string) {
  const hex = Number(str.length).toString(16).padStart(2, '0');
  const buff = Buffer.from(hex, 'hex');
  return buff.toString();
}

export function charLength(char: string) {
  const code = char.charCodeAt(0);
  return code > 0x7F && code <= 0xFFFF ? 2 : 1; // More than 2bytes count as 2
}

export function textLength(str: string) {
  return str.split('').reduce((accLen, char) => {
    return accLen + charLength(char);
  }, 0);
}

export function textSubstring(str: string, start: number, end?: number) {
  let accLen = 0;
  return str.split('').reduce((accStr, char) => {
    accLen = accLen + charLength(char);
    return accStr + (accLen > start && (!end || accLen <= end) ? char : '');
  }, '');
}

/**
 * Chinese ESC/POS printers usually only have the fullwidth yuan glyph (￥ / A3A4).
 * Halfwidth ¥ (U+00A5) becomes "?" or garbage under GBK/GB18030 font ROMs.
 */
export function normalizeCurrencySymbol(content: string, encoding: string) {
  if (!/gbk|gb2312|gb18030|cp936/i.test(encoding))
    return content;
  return content.replaceAll('\u00A5', '\uFFE5');
}

export function upperCase<T extends string>(string: T): Uppercase<T> {
  return string.toUpperCase() as Uppercase<T>;
}

export type AnyCase<T extends string> = Uppercase<T> | Lowercase<T>;

export function isKey<T extends Record<string | number | symbol, unknown> | unknown[]>(key: string | number | symbol, of: T): key is keyof T {
  return key in of;
}
