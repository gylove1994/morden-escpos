import type { NdArray } from 'ndarray';
import getPixels from 'get-pixels';
import { Image, Printer, USBAdapter } from '../src';

/**
 * 图片打印示例
 * 展示如何打印图片（Bitmap 和 Raster 模式）
 */
async function imagePrint() {
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
        .text('图片打印示例')
        .style('normal')
        .newLine()
        .drawLine();

      // 如果有图片文件，可以加载并打印
      // 注意：这里需要提供一个实际的图片路径
      const imagePath = process.argv[2]; // 从命令行参数获取图片路径

      if (imagePath) {
        try {
          // 加载图片
          const pixels = await new Promise<NdArray<Uint8Array>>((resolve, reject) => {
            getPixels(imagePath, (err, data) => {
              if (err) {
                reject(err);
              }
              else {
                resolve(data);
              }
            });
          });

          const image = new Image(pixels);

          printer
            .align('ct')
            .text('Bitmap 模式打印:')
            .newLine();

          // Bitmap 模式
          await printer.image(image, 'd24');

          printer
            .newLine()
            .text('Raster 模式打印:')
            .newLine();

          // Raster 模式
          printer.raster(image, 'normal');
        }
        catch (err) {
          console.error('图片加载失败:', err);
          printer.text('图片加载失败，请检查图片路径');
        }
      }
      else {
        printer.text('请提供图片路径作为命令行参数');
        printer.text('例如: tsx examples/image-print.ts path/to/image.png');
      }

      printer
        .newLine()
        .newLine()
        .cut()
        .close();

      console.log('图片打印完成');
    });
  }
  catch (error) {
    console.error('错误:', error);
  }
}

imagePrint();
