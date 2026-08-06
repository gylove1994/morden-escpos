/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import type { WebSerialPort, WebUSBDevice } from 'morden-node-escpos/browser';

interface BasePrinterDescriptor {
  id: string
  label: string
}

export interface WebUSBPrinterDescriptor extends BasePrinterDescriptor {
  transport: 'webusb'
  vendorId: number
  productId: number
  serialNumber?: string
  device: WebUSBDevice
}

export interface WebSerialPrinterDescriptor extends BasePrinterDescriptor {
  transport: 'webserial'
  baudRate: number
  port: WebSerialPort
}

export interface TcpPrinterDescriptor extends BasePrinterDescriptor {
  transport: 'tcp'
  host: string
  port: number
}

export type PrinterDescriptor
  = | WebUSBPrinterDescriptor
    | WebSerialPrinterDescriptor
    | TcpPrinterDescriptor;
