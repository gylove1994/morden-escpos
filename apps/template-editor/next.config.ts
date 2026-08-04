import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['morden-node-escpos', 'usb'],
  transpilePackages: ['@workspace/jsonjoy-builder', '@workspace/ui'],
};

export default nextConfig;
