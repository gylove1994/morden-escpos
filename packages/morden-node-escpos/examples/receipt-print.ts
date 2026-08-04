import { Printer, USBAdapter } from '../src';

/**
 * 完整收据打印示例
 * 展示如何打印一个完整的购物小票
 */
async function receiptPrint() {
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

    adapter.open((error) => {
      if (error) {
        console.error('打开打印机失败:', error);
        return;
      }

      const orderNumber = 'ORD-20240115-001';
      const date = new Date().toLocaleString('zh-CN');
      const cashier = '001';
      const items = [
        { name: '可口可乐', price: 3.00, quantity: 2, subtotal: 6.00 },
        { name: '薯片', price: 5.50, quantity: 1, subtotal: 5.50 },
        { name: '矿泉水', price: 2.00, quantity: 3, subtotal: 6.00 },
      ];
      const total = items.reduce((sum, item) => sum + item.subtotal, 0);

      printer
        // 标题
        .align('ct')
        .style('b')
        .size(2, 2)
        .text('*** 购物小票 ***')
        .style('normal')
        .size(1, 1)
        .newLine()
        .drawLine()
        // 订单信息
        .align('lt')
        .text(`订单号: ${orderNumber}`)
        .text(`日期: ${date}`)
        .text(`收银员: ${cashier}`)
        .drawLine()
        // 表头
        .tableCustom([
          { text: '商品', align: 'left', width: 0.4 },
          { text: '单价', align: 'right', width: 0.2 },
          { text: '数量', align: 'right', width: 0.15 },
          { text: '小计', align: 'right', width: 0.25 },
        ])
        .drawLine('-');
      // 商品列表
      for (const item of items) {
        printer.tableCustom([
          { text: item.name, align: 'left', width: 0.4 },
          { text: `¥${item.price.toFixed(2)}`, align: 'right', width: 0.2 },
          { text: item.quantity.toString(), align: 'right', width: 0.15 },
          { text: `¥${item.subtotal.toFixed(2)}`, align: 'right', width: 0.25 },
        ]);
      }
      printer
        .drawLine()
        // 合计
        .align('rt')
        .size(2, 2)
        .text(`合计: ¥${total.toFixed(2)}`)
        .size(1, 1)
        .newLine()
        // 底部信息
        .align('ct')
        .text('谢谢惠顾，欢迎再次光临！')
        .newLine()
        .newLine()
        .cut()
        .close();

      console.log('收据打印完成');
    });
  }
  catch (error) {
    console.error('错误:', error);
  }
}

receiptPrint();
