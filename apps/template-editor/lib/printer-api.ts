import type { PrintJobJSON } from 'morden-node-escpos/schema';

export interface PrinterDescriptor {
  id: string
  label: string
  vendorId: number
  productId: number
  busNumber: number
  deviceAddress: number
}

export interface PrintersResponse {
  printers: PrinterDescriptor[]
  error?: string
}

export interface PrintRequest {
  printer: Pick<PrinterDescriptor, 'vendorId' | 'productId' | 'busNumber' | 'deviceAddress'>
  template: PrintJobJSON
  data: Record<string, unknown>
}

export interface PrintResponse {
  ok: boolean
  message: string
}
