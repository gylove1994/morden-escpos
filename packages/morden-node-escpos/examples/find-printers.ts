/**
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import { USBAdapter } from '../src';

/**
 * 查找可用打印机示例
 * 展示如何查找和列出所有可用的 USB 打印机
 */
function findPrinters() {
  try {
    const devices = USBAdapter.findPrinter();

    console.log(`找到 ${devices.length} 个打印机设备:\n`);

    if (devices.length === 0) {
      console.log('未找到任何打印机设备');
      console.log('请确保:');
      console.log('1. 打印机已通过 USB 连接到电脑');
      console.log('2. 打印机已开机');
      console.log('3. 已安装打印机驱动程序');
      return;
    }

    devices.forEach((device, index) => {
      console.log(`打印机 ${index + 1}:`);
      console.log(`  VID: 0x${device.deviceDescriptor.idVendor.toString(16).padStart(4, '0')}`);
      console.log(`  PID: 0x${device.deviceDescriptor.idProduct.toString(16).padStart(4, '0')}`);
      console.log(`  制造商: ${device.deviceDescriptor.iManufacturer || '未知'}`);
      console.log(`  产品: ${device.deviceDescriptor.iProduct || '未知'}`);
      console.log('');
    });

    // 示例：使用第一个打印机
    if (devices.length > 0) {
      const firstDevice = devices[0];
      const vid = firstDevice.deviceDescriptor.idVendor;
      const pid = firstDevice.deviceDescriptor.idProduct;
      console.log('使用第一个打印机创建适配器:');
      console.log(`const adapter = new USBAdapter(0x${vid.toString(16)}, 0x${pid.toString(16)});`);
    }
  }
  catch (error) {
    console.error('查找打印机时出错:', error);
  }
}

findPrinters();
