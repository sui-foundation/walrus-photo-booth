import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aggregator.walrus-mainnet.walrus.space',
      },
      {
        protocol: 'https',
        hostname: 'cdn.tusky.io',
      }
    ],
  },
};

export default nextConfig;
