import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.68.63',
    '192.168.68.63:3000',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  devIndicators: false,
};

export default nextConfig;
