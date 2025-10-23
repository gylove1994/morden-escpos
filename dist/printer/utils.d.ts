/**
 * [getParityBit description]
 * @return {[type]} [description]
 */
export declare function getParityBit(str: string): string;
export declare function codeLength(str: string): string;
export declare function charLength(char: string): 2 | 1;
export declare function textLength(str: string): number;
export declare function textSubstring(str: string, start: number, end?: number): string;
export declare function upperCase<T extends string>(string: T): Uppercase<T>;
export type AnyCase<T extends string> = Uppercase<T> | Lowercase<T>;
export declare function isKey<T extends Record<string | number | symbol, unknown> | unknown[]>(key: string | number | symbol, of: T): key is keyof T;
//# sourceMappingURL=utils.d.ts.map