import { Printer, USBAdapter } from '../src';

/**
 * 条形码和二维码打印示例
 * 展示各种条形码类型和二维码的打印
 */
async function barcodeQRCodePrint() {
  try {
    const devices = USBAdapter.findPrinter();
    if (devices.length === 0) {
      console.error('未找到打印机');
      return;
    }

    const adapter = new USBAdapter();
    const printer = new Printer(adapter, {
      encoding: 'GB18030',
      width: 48,
    });

    adapter.open(async (error) => {
      if (error) {
        console.error('打开打印机失败:', error);
        return;
      }

      printer
        .align('ct')
        .style('b')
        .text('条形码和二维码示例')
        .style('normal')
        .newLine()
        .drawLine()
        // CODE128 条形码
        .align('ct')
        .text('CODE128 条形码:')
        .barcode(123456789, 'CODE128', {
          width: 2,
          height: 50,
          position: 'blw',
          font: 'a',
        })
        .newLine()
        .newLine()
        // EAN13 条形码
        .text('EAN13 条形码:')
        .barcode(123456789012, 'EAN13', {
          width: 2,
          height: 50,
          position: 'blw',
          font: 'a',
        })
        .newLine()
        .newLine()
        // CODE39 条形码
        .text('CODE39 条形码:')
        .barcode(123456, 'CODE39', {
          width: 2,
          height: 50,
          position: 'blw',
          font: 'a',
        })
        .newLine()
        .newLine()
        .drawLine()
        // 标准二维码
        .text('标准二维码:')
        .qrcode('https://example.com', 3, 'M', 6)
        .newLine()
        .newLine()
        // 二维码图片（更好的兼容性）
        .text('二维码图片:');

      // 二维码图片需要异步处理
      await printer.qrimage('https://example.com', {
        type: 'png',
        mode: 'dhdw',
      });

      printer
        .newLine()
        .newLine()
        .cut()
        .close();

      console.log('条形码和二维码打印完成');
    });
  }
  catch (error) {
    console.error('错误:', error);
  }
}

barcodeQRCodePrint();
