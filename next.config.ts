import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/broken-links",
        destination: "/dashboard/coverage",
        permanent: true,
      },
      {
        source: "/dashboard/websites/:id/broken-links",
        destination: "/dashboard/websites/:id/coverage",
        permanent: true,
      },
    ];
  },
  async headers() {
    // Baseline headers for routes that skip the auth/CSP proxy (API, static).
    // Document CSP with nonces is applied in src/proxy.ts — do not set CSP here.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-core",
    "@sparticuz/chromium",
    "@react-pdf/renderer",
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
