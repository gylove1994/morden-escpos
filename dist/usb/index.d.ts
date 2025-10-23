import type { Device, InEndpoint, OutEndpoint } from 'usb';
import { Buffer } from 'node:buffer';
import { Adapter } from '../adapter';
export default class USBAdapter extends Adapter<[timeout?: number]> {
    device: Device | null;
    endpoint?: OutEndpoint;
    deviceToPcEndpoint?: InEndpoint;
    constructor(vid?: number, pid?: number);
    static findPrinter(): Device[];
    static getDevice(vid: number, pid: number): Promise<unknown>;
    open(callback?: ((error: Error | null) => void) | undefined): this;
    read(callback?: ((data: Buffer) => void) | undefined): void;
    write(data: string | Buffer, callback?: ((error: Error | null) => void) | undefined): this;
    close(callback?: ((error: Error | null) => void) | undefined, _timeout?: number | undefined): this;
}
//# sourceMappingURL=index.d.ts.map