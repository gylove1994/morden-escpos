"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParityBit = getParityBit;
exports.codeLength = codeLength;
exports.charLength = charLength;
exports.textLength = textLength;
exports.textSubstring = textSubstring;
exports.upperCase = upperCase;
exports.isKey = isKey;
const node_buffer_1 = require("node:buffer");
/**
 * [getParityBit description]
 * @return {[type]} [description]
 */
function getParityBit(str) {
    let parity = 0;
    const reversedCode = str.split('').reverse().join('');
    for (let counter = 0; counter < reversedCode.length; counter += 1) {
        parity += Number.parseInt(reversedCode.charAt(counter), 10) * 3 ** ((counter + 1) % 2);
    }
    return ((10 - (parity % 10)) % 10).toString();
}
function codeLength(str) {
    const hex = Number(str.length).toString(16).padStart(2, '0');
    const buff = node_buffer_1.Buffer.from(hex, 'hex');
    return buff.toString();
}
function charLength(char) {
    const code = char.charCodeAt(0);
    return code > 0x7F && code <= 0xFFFF ? 2 : 1; // More than 2bytes count as 2
}
function textLength(str) {
    return str.split('').reduce((accLen, char) => {
        return accLen + charLength(char);
    }, 0);
}
function textSubstring(str, start, end) {
    let accLen = 0;
    return str.split('').reduce((accStr, char) => {
        accLen = accLen + charLength(char);
        return accStr + (accLen > start && (!end || accLen <= end) ? char : '');
    }, '');
}
function upperCase(string) {
    return string.toUpperCase();
}
function isKey(key, of) {
    return key in of;
}
//# sourceMappingURL=utils.js.map