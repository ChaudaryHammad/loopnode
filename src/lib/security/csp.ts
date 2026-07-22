import type { NextResponse } from "next/server";

const CLOUDINARY_HOST = "https://res.cloudinary.com";
const RECAPTCHA_SCRIPT_HOSTS = [
  "https://www.google.com",
  "https://www.gstatic.com",
  "https://www.recaptcha.net",
].join(" ");
const RECAPTCHA_FRAME_HOSTS = [
  "https://www.google.com",
  "https://www.recaptcha.net",
].join(" ");

/** Inline theme boot — must run with a matching CSP nonce. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme'),d=!t||t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.add(d?'dark':'light')}catch(e){document.documentElement.classList.add('dark')}})();`;

export function buildContentSecurityPolicy(options: {
  nonce: string;
  isDev: boolean;
}): string {
  const { nonce, isDev } = options;

  // script-src: nonce + strict-dynamic (no unsafe-inline) → Health Mesh CSP grade A.
  // Google hosts kept for browsers without strict-dynamic; trusted React bundle
  // can still load reCAPTCHA under strict-dynamic.
  // style-src keeps unsafe-inline so Framer Motion / UI libs don't break (−5 only).
  const directives = [
    "default-src 'self'",
    [
      "script-src",
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      RECAPTCHA_SCRIPT_HOSTS,
      isDev ? "'unsafe-eval'" : "",
    ]
      .filter(Boolean)
      .join(" "),
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${CLOUDINARY_HOST}`,
    "font-src 'self' data:",
    [
      "connect-src",
      "'self'",
      RECAPTCHA_SCRIPT_HOSTS,
      CLOUDINARY_HOST,
      "https://api.cloudinary.com",
      // Vercel preview toolbar / live feedback (harmless if unused)
      "https://vercel.live",
      "wss://vercel.live",
    ].join(" "),
    `frame-src 'self' ${RECAPTCHA_FRAME_HOSTS}`,
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ").replace(/\s{2,}/g, " ").trim();
}

export function applySecurityHeaders(
  headers: Headers,
  csp: string,
  options?: { isDev?: boolean }
) {
  const isDev = options?.isDev ?? process.env.NODE_ENV !== "production";

  headers.set("Content-Security-Policy", csp);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  headers.set("X-DNS-Prefetch-Control", "on");

  if (!isDev) {
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
}

/** Convenience when mutating a NextResponse. */
export function withSecurityHeaders(
  response: NextResponse,
  csp: string,
  options?: { isDev?: boolean }
) {
  applySecurityHeaders(response.headers, csp, options);
  return response;
}
