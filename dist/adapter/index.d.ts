import type { Buffer } from 'node:buffer';
import EventEmitter from 'node:events';
export declare class NotImplementedException extends Error {
}
export declare abstract class Adapter<CloseArgs extends unknown[]> extends EventEmitter {
    abstract open(callback?: (error: Error | null) => void): this;
    abstract write(data: Buffer | string, callback?: (error: Error | null) => void): this;
    abstract close(callback?: (error: Error | null) => void, ...closeArgs: CloseArgs): this;
    abstract read(callback?: (data: Buffer) => void): void;
}
//# sourceMappingURL=index.d.ts.map