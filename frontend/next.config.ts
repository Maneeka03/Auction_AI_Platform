import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy all /api/* requests to the backend so the browser never calls the backend
  // directly. This eliminates CORS entirely and makes the same build work both locally
  // and through any Cloudflare tunnel without rebuilding.
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
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
};

export default nextConfig;
