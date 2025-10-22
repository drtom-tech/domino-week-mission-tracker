// Path: lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "@neondatabase/serverless";
import { NeonAdapter } from "@auth/neon-adapter";

// Initialize the Neon DB pool for the adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = NeonAdapter(pool);

// Helper function to verify password hash using Web Crypto API
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedHash === hash;
}

export const authOptions: NextAuthOptions = {
  // Use the Neon adapter. It handles user/account creation for OAuth providers automatically.
  adapter: adapter,

  // Use JWT strategy for sessions
  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Authorize: Missing credentials");
          return null;
        }

        // The authorize function runs *before* the adapter can be used.
        // So, we query the DB directly here using the same pool.
        try {
          const { rows } = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [credentials.email]
          );
          const user = rows[0];

          if (!user || !user.password_hash) {
            console.log("Authorize: User not found or no password hash.");
            return null; // User not found or is an OAuth-only user
          }

          const isValid = await verifyPassword(credentials.password, user.password_hash);

          if (!isValid) {
            console.log("Authorize: Invalid password.");
            return null; // Password incorrect
          }

          console.log("Authorize: Credentials valid, returning user.");
          // Return the user object that matches NextAuth's expectations
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (dbError) {
          console.error("Database error during authorize:", dbError);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // The `signIn` callback is no longer needed. The adapter handles Google user creation automatically.

    // This JWT callback is called when a token is created.
    // We add the user's ID to the token here.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // The session callback is called when a session is checked.
    // We add the user ID from the token to the session object.
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },

  secret: process.env.AUTH_SECRET, // Use AUTH_SECRET for Vercel
};
