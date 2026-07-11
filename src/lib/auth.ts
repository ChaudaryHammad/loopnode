import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { loginSchema } from "./validations/auth";
import { captureLoginLocation } from "@/lib/user-location";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
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

        if (dbUser) {
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        session.user.image = (token.picture as string | null | undefined) ?? null;
        session.user.name = (token.name as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          const user = await prisma.user.findFirst({
            where: {
              email: email.toLowerCase(),
              deletedAt: null, // Exclude soft-deleted users
            },
          });

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
