import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { GoogleProfile } from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { loginSchema } from "./validations/auth";
import { captureLoginLocation, captureSignupLocation } from "@/lib/user-location";
import { ensureTrialSubscription } from "@/lib/subscription";
import { isGoogleAuthEnabled } from "@/lib/google-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const googleProfile = profile as GoogleProfile | undefined;
      const email = (googleProfile?.email ?? user.email)?.toLowerCase();

      if (!email) {
        return "/login?error=EmailRequired";
      }

      if (!googleProfile?.email_verified) {
        return "/login?error=EmailNotVerified";
      }

      const existing = await prisma.user.findFirst({
        where: { email },
        select: { id: true, deletedAt: true },
      });

      if (existing?.deletedAt) {
        return "/login?error=AccountDeleted";
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "USER";
        token.picture = user.image;
        token.name = user.name;
      }

      if (trigger === "update" && session) {
        const update = session as { image?: string | null; name?: string | null };
        if (update.image !== undefined) token.picture = update.image;
        if (update.name !== undefined) token.name = update.name;
      }

      if (token.id) {
        const dbUser = await prisma.user.findFirst({
          where: { id: token.id as string, deletedAt: null },
          select: { name: true, image: true, role: true },
        });

        // Soft-deleted or missing users invalidate the JWT session.
        if (!dbUser) {
          return null;
        }

        token.name = dbUser.name;
        token.picture = dbUser.image;
        token.role = dbUser.role;
      }

      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "USER";
        session.user.image = (token.picture as string | null | undefined) ?? null;
        session.user.name = (token.name as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (!user.id || account?.provider !== "google") return;

      try {
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
          select: { image: true },
        });

        // Auth.js creates OAuth users with emailVerified: null — set it from Google.
        // Also mark verified when linking Google to an existing email/password account.
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: new Date(),
            ...(!existing?.image && user.image ? { image: user.image } : {}),
          },
        });

        if (isNewUser) {
          await ensureTrialSubscription(user.id);

          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: "USER_REGISTERED",
              description: "Welcome aboard — signed up with Google",
            },
          });

          await captureSignupLocation(user.id).catch((error) => {
            console.error("Failed to capture Google signup location:", error);
          });
        }

        await captureLoginLocation(user.id).catch((error) => {
          console.error("Failed to capture Google login location:", error);
        });
      } catch (error) {
        console.error("Google sign-in post-processing failed:", error);
      }
    },
  },
  providers: [
    ...(isGoogleAuthEnabled()
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            // Google verifies emails; safe to link to existing email/password users.
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: {
                prompt: "select_account",
                response_type: "code",
              },
            },
            profile(profile: GoogleProfile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email.toLowerCase(),
                image: profile.picture,
                // Adapter createUser overwrites this to null; events.signIn sets it.
                emailVerified: profile.email_verified ? new Date() : null,
              };
            },
          }),
        ]
      : []),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          const user = await prisma.user.findFirst({
            where: {
              email: email.toLowerCase(),
              deletedAt: null,
            },
          });

          // OAuth-only users have no password — reject credentials sign-in.
          if (!user || !user.hashedPassword) return null;

          const passwordsMatch = await bcrypt.compare(password, user.hashedPassword);

          if (passwordsMatch) {
            void captureLoginLocation(user.id).catch((error) => {
              console.error("Failed to capture login location:", error);
            });

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
            };
          }
        }

        return null;
      },
    }),
  ],
});
