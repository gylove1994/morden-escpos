"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_buffer_1 = require("node:buffer");
const node_os_1 = __importDefault(require("node:os"));
const usb_1 = require("usb");
const adapter_1 = require("../adapter");
/**
 * [USB Class Codes ]
 * @type {object}
 * @docs http://www.usb.org/developers/defined_class
 */
const IFACE_CLASS = {
    AUDIO: 0x01,
    HID: 0x03,
    PRINTER: 0x07,
    HUB: 0x09,
};
class USBAdapter extends adapter_1.Adapter {
    device = null;
    endpoint;
    deviceToPcEndpoint;
    constructor(vid, pid) {
        super();
        // const self = this;
        this.device = null;
        if (vid && pid) {
            this.device = (0, usb_1.findByIds)(vid, pid) ?? null;
        }
        else if (vid) {
            // Set spesific USB device from devices array as coming from USB.findPrinter() function.
            // for example
            // let devices = escpos.USB.findPrinter();
            // => devices [ Device1, Device2 ];
            // And Then
            // const device = new escpos.USB(Device1); OR device = new escpos.USB(Device2);
            this.device = vid;
        }
        else {
            const devices = USBAdapter.findPrinter();
            if (devices && devices.length)
                this.device = devices[0] ?? null;
        }
        if (!this.device)
            throw new Error('Can not find printer');
        // usb.on('detach', (device) => {
        //   if (device === self.device) {
        //     self.emit('detach', device);
        //     self.emit('disconnect', device);
        //     self.device = null;
        //   }
        // });
        return this;
    }
    static findPrinter() {
        return (0, usb_1.getDeviceList)().filter((device) => {
            try {
                return device.configDescriptor?.interfaces.filter((iface) => {
                    return iface.filter((conf) => {
                        return conf.bInterfaceClass === IFACE_CLASS.PRINTER;
                    }).length;
                }).length;
            }
            catch (_e) {
                // console.warn(_e)
                return false;
            }
        });
    }
    static getDevice(vid, pid) {
        return new Promise((resolve, reject) => {
            try {
                const device = (0, usb_1.findByIds)(vid, pid);
                device?.open();
                resolve(device);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    ;
    open(callback) {
        const self = this;
        let counter = 0;
        if (!this.device) {
            callback?.(new Error('Device is null'));
            return this;
        }
        const device = this.device;
        device.open();
        if (!device.interfaces) {
            callback?.(new Error('Device interfaces not available'));
            return this;
        }
        const interfacesCount = device.interfaces.length;
        device.interfaces.forEach((iface) => {
            (function (iface) {
                iface.setAltSetting(iface.altSetting, () => {
                    try {
                        // http://libusb.sourceforge.net/api-1.0/group__dev.html#gab14d11ed6eac7519bb94795659d2c971
                        // libusb_kernel_driver_active / libusb_attach_kernel_driver / libusb_detach_kernel_driver : "This functionality is not available on Windows."
                        if (node_os_1.default.platform() !== 'win32') {
                            if (iface.isKernelDriverActive()) {
                                try {
                                    iface.detachKernelDriver();
                                }
                                catch (e) {
                                    console.error('[ERROR] Could not detatch kernel driver: %s', e);
                                }
                            }
                        }
                        iface.claim(); // must be called before using any endpoints of this interface.
                        iface.endpoints.forEach((endpoint) => {
                            if (endpoint.direction === 'out' && !self.endpoint) {
                                self.endpoint = endpoint;
                            }
                            if (endpoint.direction === 'in' && !self.deviceToPcEndpoint) {
                                self.deviceToPcEndpoint = endpoint;
                            }
                        });
                        if (self.endpoint) {
                            self.emit('connect', device);
                            callback?.(null);
                        }
                        else if (++counter === interfacesCount && !self.endpoint) {
                            callback?.(new Error('Can not find endpoint from printer'));
                        }
                    }
                    catch (err) {
                        // Try/Catch block to prevent process from exit due to uncaught exception.
                        // i.e LIBUSB_ERROR_ACCESS might be thrown by claim() if USB device is taken by another process
                        // example: MacOS Parallels
                        callback?.(err);
                    }
                });
            })(iface);
        });
        return this;
    }
    read(callback) {
        if (!this.deviceToPcEndpoint) {
            return;
        }
        this.deviceToPcEndpoint.transfer(64, (_error, data) => {
            if (data) {
                callback?.(data);
            }
        });
    }
    write(data, callback) {
        this.emit('data', data);
        if (!this.endpoint) {
            callback?.(new Error('Endpoint is not available'));
            return this;
        }
        const bufferData = typeof data === 'string' ? node_buffer_1.Buffer.from(data) : data;
        this.endpoint.transfer(bufferData, (error, _actual) => {
            if (callback) {
                callback(error ?? null);
            }
        });
        return this;
    }
    close(callback, _timeout) {
        if (!this.device) {
            callback?.(null);
            return this;
        }
        try {
            this.device.close();
            usb_1.usb.removeAllListeners('detach');
            callback?.(null);
            this.emit('close', this.device);
        }
        catch (err) {
            callback?.(err);
        }
        return this;
    }
}
exports.default = USBAdapter;
//# sourceMappingURL=index.js.map