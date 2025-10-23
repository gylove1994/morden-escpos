"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusClasses = exports.RollPaperSensorStatus = exports.ErrorCauseStatus = exports.OfflineCauseStatus = exports.PrinterStatus = exports.DeviceStatus = void 0;
const _ = __importStar(require("./commands"));
var Status;
(function (Status) {
    Status["Ok"] = "ok";
    Status["Warning"] = "warning";
    Status["Error"] = "error";
})(Status || (Status = {}));
// noinspection JSBitwiseOperatorUsage
class DeviceStatus {
    byte;
    bits = [];
    bitsAsc = [];
    constructor(byte) {
        this.byte = byte;
        for (let j = 7; j >= 0; j--) {
            const bit = byte & (1 << j) ? 1 : 0;
            this.bits.push(bit);
        }
        this.bitsAsc = this.bits.slice();
        this.bitsAsc.reverse();
    }
    getBits() {
        return this.bits.join('');
    }
    toBaseJSON(name) {
        return {
            className: name,
            byte: this.byte,
            bits: this.getBits(),
            statuses: [],
        };
    }
}
exports.DeviceStatus = DeviceStatus;
class PrinterStatus extends DeviceStatus {
    static commands() {
        return [_.DLE, _.EOT, String.fromCharCode(1)];
    }
    toJSON() {
        const result = super.toBaseJSON('PrinterStatus');
        for (let i = 0; i < 8; i++) {
            let label = '';
            let status = Status.Ok;
            switch (i) {
                case 2:
                    if (this.bitsAsc[i] === 1) {
                        label = 'Drawer kick-out connector pin 3 is HIGH';
                    }
                    else {
                        label = 'Drawer kick-out connector pin 3 is LOW';
                    }
                    break;
                case 3:
                    if (this.bitsAsc[i] === 1) {
                        status = Status.Error;
                        label = 'Offline';
                    }
                    else {
                        label = 'Online';
                    }
                    break;
                case 5:
                    if (this.bitsAsc[i] === 1) {
                        status = Status.Error;
                        label = 'Waiting for online recovery';
                    }
                    else {
                        label = 'Not waiting for online recovery';
                    }
                    break;
                case 6:
                    if (this.bitsAsc[i] === 1) {
                        label = 'Paper feed button is being pressed';
                    }
                    else {
                        label = 'Paper feed button is not being pressed';
                    }
                    break;
                default:
                    label = 'Fixed';
                    break;
            }
            result.statuses.push({
                bit: i,
                // todo: fix this
                value: this.bitsAsc[i],
                label,
                status,
            });
        }
        return result;
    }
}
exports.PrinterStatus = PrinterStatus;
class OfflineCauseStatus extends DeviceStatus {
    static commands() {
        return [_.DLE, _.EOT, String.fromCharCode(2)];
    }
    toJSON() {
        const result = super.toBaseJSON('OfflineCauseStatus');
        for (let i = 0; i < 8; i++) {
            let label = '';
            let status = Status.Error;
            switch (i) {
                case 2:
                    if (this.bitsAsc[i] === 1) {
                        status = Status.Error;
                        label = 'Cover is open';
                    }
                    else {
                        label = 'Cover is closed';
                    }
                    break;
                case 3:
                    if (this.bitsAsc[i] === 1) {
                        status = Status.Error;
                        label = 'Paper is being fed by the paper feed button';
                    }
                    else {
                        label = 'Paper is not being fed by the paper feed button';
                    }
                    break;
                case 5:
                    if (this.bitsAsc[i] === 1) {
                        status = Status.Error;
                        label = 'Printing stops due to a paper-end';
                    }
                    else {
                        label = 'No paper-end stop';
                    }
                    break;
                case 6:
                    if (this.bitsAsc[i] === 1) {
                        status = Status.Error;
                        label = 'Error occurred';
                    }
                    else {
                        label = 'No error';
                    }
                    break;
                default:
                    label = 'Fixed';
                    break;
            }
            result.statuses.push({
                bit: i,
                // todo: fix this
                value: this.bitsAsc[i],
                label,
                status,
            });
        }
        return result;
    }
}
exports.OfflineCauseStatus = OfflineCauseStatus;
class ErrorCauseStatus extends DeviceStatus {
    static commands() {
        return [_.DLE, _.EOT, String.fromCharCode(3)];
    }
    toJSON() {
        const result = super.toBaseJSON('ErrorCauseStatus');
        for (let i = 0; i < 8; i++) {
            let label = '';
            let status = Status.Ok;
            switch (i) {
                case 2:
                    if (this.bitsAsc[i] === 1) {
                        status = Status.Error;
                        label = 'Recoverable error occurred';
                    }
                    else {
                        label = 'No recoverable error';
                    }
                    break;
                case 3:
                    if (this.bitsAsc[i] === 1) {
                        status = Status.Error;
                        label = 'Autocutter error occurred';
                    }
                    else {
                        label = 'No autocutter error';
                    }
                    break;
                case 5:
                    if (this.bitsAsc[i] === 1) {
                        status = Status.Error;
                        label = 'Unrecoverable error occurred';
                    }
                    else {
                        label = 'No unrecoverable error';
                    }
                    break;
                case 6:
                    if (this.bitsAsc[i] === 1) {
                        status = Status.Error;
                        label = 'Auto-recoverable error occurred';
                    }
                    else {
                        label = 'No auto-recoverable error';
                    }
                    break;
                default:
                    label = 'Fixed';
                    break;
            }
            result.statuses.push({
                bit: i,
                // todo: fix this
                value: this.bitsAsc[i],
                label,
                status,
            });
        }
        return result;
    }
}
exports.ErrorCauseStatus = ErrorCauseStatus;
class RollPaperSensorStatus extends DeviceStatus {
    static commands() {
        return [_.DLE, _.EOT, String.fromCharCode(4)];
    }
    toJSON() {
        const result = super.toBaseJSON('RollPaperSensorStatus');
        for (let i = 0; i <= 1; i++) {
            result.statuses.push({
                bit: i,
                // todo: fix this
                value: this.bitsAsc[i],
                label: 'Fixed',
                status: Status.Ok,
            });
        }
        let label = '';
        let status = Status.Ok;
        if (this.bitsAsc[2] === 1 && this.bitsAsc[3] === 1) {
            status = Status.Warning;
            label = 'Roll paper near-end sensor: paper near-end';
        }
        else if (this.bitsAsc[2] === 0 && this.bitsAsc[3] === 0) {
            label = 'Roll paper near-end sensor: paper adequate';
        }
        result.statuses.push({
            bit: '2,3',
            value: `${this.bitsAsc[2]}${this.bitsAsc[3]}`,
            label,
            status,
        });
        result.statuses.push({
            bit: 4,
            // todo: fix this
            value: this.bitsAsc[4],
            label: 'Fixed',
            status: Status.Ok,
        });
        label = '';
        status = Status.Ok;
        if (this.bitsAsc[5] === 1 && this.bitsAsc[6] === 1) {
            status = Status.Error;
            label = 'Roll paper end sensor: paper not present';
        }
        else if (this.bitsAsc[5] === 0 && this.bitsAsc[6] === 0) {
            label = 'Roll paper end sensor: paper present';
        }
        result.statuses.push({
            bit: '5,6',
            value: `${this.bitsAsc[5]}${this.bitsAsc[6]}`,
            label,
            status,
        });
        for (let i = 7; i <= 8; i++) {
            result.statuses.push({
                bit: i,
                // todo: fix this
                value: this.bitsAsc[i],
                label: 'Fixed',
                status: Status.Ok,
            });
        }
        return result;
    }
}
exports.RollPaperSensorStatus = RollPaperSensorStatus;
exports.statusClasses = {
    PrinterStatus,
    OfflineCauseStatus,
    ErrorCauseStatus,
    RollPaperSensorStatus,
};
//# sourceMappingURL=statuses.js.map