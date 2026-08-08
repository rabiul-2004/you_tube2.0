import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  allowedDevOrigins: ["*"],
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
};

export default nextConfig;
