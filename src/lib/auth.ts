import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { SiweMessage } from "siwe";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      id: "siwe",
      name: "Ethereum",
      credentials: {
        message: { type: "text" },
        signature: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.message || !credentials?.signature) return null;

        const siwe = new SiweMessage(JSON.parse(credentials.message as string));
        const result = await siwe.verify({
          signature: credentials.signature as string,
        });

        if (!result.success) return null;

        const address = siwe.address.toLowerCase();
        const db = await getDb();

        let user = await db.first<{ id: string; address: string; name: string }>(
          "SELECT * FROM users WHERE address = ?",
          address
        );

        if (!user) {
          const id = uuidv4();
          await db.run(
            "INSERT INTO users (id, address, auth_provider) VALUES (?, ?, 'siwe')",
            id,
            address
          );
          user = {
            id,
            address,
            name: address.slice(0, 6) + "..." + address.slice(-4),
          };
        }

        return { id: user.id, name: user.name, address };
      },
    }),
    Credentials({
      id: "email",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase();
        const db = await getDb();

        let user = await db.first<{ id: string; email: string; name: string }>(
          "SELECT * FROM users WHERE email = ?",
          email
        );

        if (!user) {
          const id = uuidv4();
          const name = email.split("@")[0];
          await db.run(
            "INSERT INTO users (id, email, name, auth_provider) VALUES (?, ?, ?, 'email')",
            id,
            email,
            name
          );
          user = { id, email, name };
        }

        return { id: user.id, name: user.name, email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.address = (user as { address?: string }).address;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      (session.user as { address?: string }).address = token.address as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
