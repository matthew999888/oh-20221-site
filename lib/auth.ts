import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { roles: { include: { role: true } } }
        });

        if (!user) {
          throw new Error("Invalid email or password.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password.");
        }

        // NOTE: we deliberately do NOT block sign-in for pending/roleless
        // users here — middleware routes them to /waiting-approval so they
        // can still log in and see that page rather than a generic error.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          roles: user.roles.map((ur) => ur.role.slug)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.status = (user.status ?? "pending") as "pending" | "approved";
        token.roles = user.roles ?? [];
      }

      // Lets a client call `useSession().update()` (e.g. the
      // /waiting-approval "check again" button) to re-pull fresh
      // status/roles from the DB without forcing a full re-login.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { roles: { include: { role: true } } }
        });
        if (fresh) {
          token.status = fresh.status;
          token.roles = fresh.roles.map((ur) => ur.role.slug);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.status = token.status as "pending" | "approved";
        session.user.roles = (token.roles as string[]) ?? [];
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
