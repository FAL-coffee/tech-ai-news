import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@tech-ai-news/db", "@tech-ai-news/shared"],
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
