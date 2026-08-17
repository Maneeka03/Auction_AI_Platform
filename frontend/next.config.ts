import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],

  async rewrites() {
    const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
    const minio = process.env.MINIO_INTERNAL_URL ?? "http://localhost:9000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/minio/:path*", destination: `${minio}/:path*` },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/provenix/**",
      },
    ],
  },

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;