import type { NextAuthConfig } from "next-auth";
import { getSafeRedirectPath } from "@/lib/auth-redirect";

export const authConfig = {
  pages: {
    signIn: "/login",
    // Do not set `newUser` — OAuth sign-ups must land on callbackUrl (dashboard),
    // not the email/password registration form.
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAuth = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ].includes(nextUrl.pathname);

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    redirect({ url, baseUrl }) {
      // Relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${getSafeRedirectPath(url)}`;
      }

      try {
        const target = new URL(url);
        // Same-origin absolute URLs only
        if (target.origin === baseUrl) {
          return `${baseUrl}${getSafeRedirectPath(`${target.pathname}${target.search}${target.hash}`)}`;
        }
      } catch {
        // fall through
      }

      return baseUrl;
    },
  },
  providers: [], // Added in auth.ts (Node runtime)
} satisfies NextAuthConfig;
