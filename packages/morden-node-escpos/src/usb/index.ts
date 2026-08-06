/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
/* eslint-disable ts/no-this-alias */
import type { Device, InEndpoint, OutEndpoint } from 'usb';
import { Buffer } from 'node:buffer';

import os from 'node:os';
import { findByIds, getDeviceList, usb } from 'usb';

import { Adapter } from '../adapter';

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

export default class USBAdapter extends Adapter<[timeout?: number]> {
  device: Device | null = null;
  endpoint?: OutEndpoint;
  deviceToPcEndpoint?: InEndpoint;

  constructor(device?: Device);
  constructor(vid?: number, pid?: number);
  constructor(vidOrDevice?: number | Device, pid?: number) {
    super();
    this.device = null;
    if (typeof vidOrDevice === 'object') {
      this.device = vidOrDevice;
    }
    else if (vidOrDevice && pid) {
      this.device = findByIds(vidOrDevice, pid) ?? null;
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
    return getDeviceList().filter((device) => {
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

  static getDevice(vid: number, pid: number) {
    return new Promise((resolve, reject) => {
      try {
        const device = findByIds(vid, pid);
        device?.open();
        resolve(device);
      }
      catch (err) {
        reject(err);
      }
    });
  };

  open(callback?: ((error: Error | null) => void) | undefined): this {
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

    device.interfaces.forEach((iface: any) => {
      (function (iface) {
        iface.setAltSetting(iface.altSetting, () => {
          try {
            // http://libusb.sourceforge.net/api-1.0/group__dev.html#gab14d11ed6eac7519bb94795659d2c971
            // libusb_kernel_driver_active / libusb_attach_kernel_driver / libusb_detach_kernel_driver : "This functionality is not available on Windows."
            if (os.platform() !== 'win32') {
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
            iface.endpoints.forEach((endpoint: any) => {
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
          catch (err: any) {
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

  read(callback?: ((data: Buffer) => void) | undefined): void {
    if (!this.deviceToPcEndpoint) {
      return;
    }
    this.deviceToPcEndpoint.transfer(64, (_error, data) => {
      if (data) {
        callback?.(data);
      }
    });
  }

  write(data: string | Buffer, callback?: ((error: Error | null) => void) | undefined): this {
    this.emit('data', data);
    if (!this.endpoint) {
      callback?.(new Error('Endpoint is not available'));
      return this;
    }
    const bufferData = typeof data === 'string' ? Buffer.from(data) : data;
    this.endpoint.transfer(bufferData, (error, _actual) => {
      if (callback) {
        callback(error ?? null);
      }
    });
    return this;
  }

  close(callback?: ((error: Error | null) => void) | undefined, _timeout?: number | undefined): this {
    if (!this.device) {
      callback?.(null);
      return this;
    }
    try {
      this.device.close();
      usb.removeAllListeners('detach');
      callback?.(null);
      this.emit('close', this.device);
    }
    catch (err: any) {
      callback?.(err);
    }
    return this;
  }
}
