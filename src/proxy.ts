import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import {
  applySecurityHeaders,
  buildContentSecurityPolicy,
} from "@/lib/security/csp";

const { auth } = NextAuth(authConfig);

/**
 * Auth gate + per-request CSP nonce.
 * Next.js reads Content-Security-Policy from the request to stamp
 * framework scripts with the matching nonce.
 */
export default auth((req) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";
  const csp = buildContentSecurityPolicy({ nonce, isDev });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  applySecurityHeaders(response.headers, csp, { isDev });
  return response;
});

export const config = {
  matcher: [
    /*
     * Run on document navigations. Skip API, Next internals, and common
     * static assets so CSP/nonce work stays on HTML routes.
     */
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
