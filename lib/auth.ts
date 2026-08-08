import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

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
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile", type: "text" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        // `req.headers` is a plain object here, not a Headers instance,
        // so wrap it before handing it to the shared IP helper.
        const ip = getClientIp(new Headers((req?.headers ?? {}) as Record<string, string>));
        const email = credentials.email.toLowerCase();

        // Two limits, deliberately. The per-IP limit stops one host from
        // spraying many accounts; the per-email limit stops a distributed
        // botnet from grinding a single account. Either alone leaves a gap.
        const [byIp, byEmail] = await Promise.all([
          checkRateLimit("auth", `ip:${ip}`),
          checkRateLimit("auth", `email:${email}`)
        ]);

        if (!byIp.success || !byEmail.success) {
          const wait = Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds);
          throw new Error(
            `Too many sign-in attempts. Please wait ${Math.ceil(wait / 60)} minute(s) and try again.`
          );
        }

        const turnstile = await verifyTurnstile(credentials.turnstileToken, ip);
        if (!turnstile.success) {
          throw new Error(turnstile.reason);
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { roles: { include: { role: true } } }
        });

        if (!user) {
          // Same message and roughly the same work as a wrong password,
          // so response timing doesn't reveal which emails are registered.
          await verifyPassword(
            credentials.password,
            "pbkdf2$sha256$600000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
          );
          throw new Error("Invalid email or password.");
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password.");
        }

        // Transparent upgrade: legacy bcrypt hashes (and any hash below
        // the current iteration count) are replaced now that we have the
        // plaintext in hand. Failure here must not block a valid sign-in.
        if (needsRehash(user.passwordHash)) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { passwordHash: await hashPassword(credentials.password) }
            });
          } catch (err) {
            console.error("[auth] password rehash failed for user", user.id, err);
          }
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
