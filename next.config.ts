import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "puppeteer",
    "lighthouse",
    "cheerio",
    "axe-core",
    "@trigger.dev/sdk",
    "@prisma/client",
    "@prisma/adapter-pg",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
