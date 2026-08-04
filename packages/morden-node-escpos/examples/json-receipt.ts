import type { PrintJobJSON } from '../src';
import { PrinterController } from '../src';

/**
 * JSON 格式收据打印示例
 * 展示如何使用 JSON 格式打印完整的收据
 */
async function jsonReceipt() {
  try {
    const controller = new PrinterController({
      encoding: 'GB18030',
      width: 48,
    });

    await controller.init();
    console.log('打印机已初始化');

    const orderNumber = 'ORD-20240115-001';
    const date = new Date().toLocaleString('zh-CN');
    const cashier = '001';
    const items = [
      { name: '可口可乐', price: 3.00, quantity: 2, subtotal: 6.00 },
      { name: '薯片', price: 5.50, quantity: 1, subtotal: 5.50 },
      { name: '矿泉水', price: 2.00, quantity: 3, subtotal: 6.00 },
    ];
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    const printJob: PrintJobJSON = {
      name: '订单打印',
      config: {
        encoding: 'GB18030',
        width: 48,
      },
      commands: [
        // 标题
        { type: 'align', value: 'ct' },
        { type: 'style', value: 'b' },
        { type: 'size', width: 2, height: 2 },
        { type: 'text', content: '*** 购物小票 ***' },
        { type: 'size', width: 1, height: 1 },
        { type: 'style', value: 'normal' },
        { type: 'newLine' },
        { type: 'drawLine' },
        // 订单信息
        { type: 'align', value: 'lt' },
        { type: 'text', content: `订单号: ${orderNumber}` },
        { type: 'text', content: `日期: ${date}` },
        { type: 'text', content: `收银员: ${cashier}` },
        { type: 'drawLine' },
        // 表头
        {
          type: 'tableCustom',
          data: [
            { text: '商品', align: 'left', width: 0.4 },
            { text: '单价', align: 'right', width: 0.2 },
            { text: '数量', align: 'right', width: 0.15 },
            { text: '小计', align: 'right', width: 0.25 },
          ],
        },
        { type: 'drawLine', character: '-' },
        // 商品列表
        ...items.flatMap(item => [
          {
            type: 'tableCustom' as const,
            data: [
              { text: item.name, align: 'left' as const, width: 0.4 },
              { text: `¥${item.price.toFixed(2)}`, align: 'right' as const, width: 0.2 },
              { text: item.quantity.toString(), align: 'right' as const, width: 0.15 },
              { text: `¥${item.subtotal.toFixed(2)}`, align: 'right' as const, width: 0.25 },
            ],
          },
        ]),
        { type: 'drawLine' },
        // 合计
        { type: 'align', value: 'rt' },
        { type: 'size', width: 2, height: 2 },
        { type: 'text', content: `合计: ¥${total.toFixed(2)}` },
        { type: 'size', width: 1, height: 1 },
        { type: 'newLine' },
        // 底部信息
        { type: 'align', value: 'ct' },
        { type: 'text', content: '谢谢惠顾，欢迎再次光临！' },
        { type: 'newLine' },
        { type: 'newLine' },
        { type: 'cut' },
      ],
    };

    await controller.executeJob(printJob);
    await controller.flush();
    await controller.close();

    console.log('收据打印完成');
  }
  catch (error) {
    console.error('错误:', error);
  }
}

jsonReceipt();
