"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Adapter = exports.NotImplementedException = void 0;
const node_events_1 = __importDefault(require("node:events"));
class NotImplementedException extends Error {
}
exports.NotImplementedException = NotImplementedException;
class Adapter extends node_events_1.default {
}
exports.Adapter = Adapter;
//# sourceMappingURL=index.js.map