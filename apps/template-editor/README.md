# Receipt Studio

纯前端 ESC/POS 小票模板编辑器。生产构建使用 Next.js 静态导出，不需要
Node.js 服务端运行时，打印数据由浏览器直接发送到用户本机或局域网打印机。

## 开发与构建

```bash
pnpm dev
pnpm --filter @workspace/template-editor build
```

静态文件生成到 `apps/template-editor/out/`，可部署到任意静态文件服务。

## 浏览器打印

- USB：Chrome / Edge 的 WebUSB，需要用户点击“选择设备”授权。
- 串口：Chrome / Edge 的 Web Serial，可配置波特率。
- 网络 RAW 9100：需要提供 Direct Sockets 能力的 Chrome 隔离式 Web 应用；
  普通浏览器标签页不能直接创建 TCP Socket。
- WebUSB 和 Web Serial 需要 HTTPS 安全上下文；本地开发可使用 `localhost`。

图片命令在浏览器打印时仅接受可跨域访问的 `http(s)` 地址。
