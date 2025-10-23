// auth.ts
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./lib/db"; 

import { 
  users, 
  accounts, 
  sessions, 
  verificationTokens // <-- THE FIX (was verification_tokens)
} from "./drizzle/schema"; 

import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens, // <-- THE FIX (was verification_tokens)
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database", 
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});