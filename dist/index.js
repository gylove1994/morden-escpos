"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const printer_1 = __importDefault(require("./printer"));
const usb_1 = __importDefault(require("./usb"));
const device = new usb_1.default();
const printer = new printer_1.default(device, {
    encoding: 'GBK',
    width: 48,
});
device.open((e) => {
    if (e) {
        console.error('open', e);
        return;
    }
    printer.font('A')
        .align('CT')
        .style('BU')
        .size(1, 1)
        .drawLine('-')
        .text('爱你老婆喵', 'UTF-8')
        .text('爱你老婆喵', 'GBK')
        .drawLine('-')
        .cut(true, 3)
        .close();
    device.close();
});
//# sourceMappingURL=index.js.map