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
      },
      {
        protocol: 'https',
        hostname: 'xsvuwjxzzwlmjsvsjzns.supabase.co',
      },
    ],
  },
};

export default nextConfig;
