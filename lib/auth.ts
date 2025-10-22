// Path: lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "@neondatabase/serverless";
// Correct Import: Use default import for NeonAdapter
import NeonAdapter from "@auth/neon-adapter";

// Initialize the Neon DB pool. DO NOT create it inside the NextAuth handler when using CredentialsProvider.
// Create it once here. The adapter pattern differs slightly from the lazy init pattern.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Pass the Pool instance directly to the NeonAdapter default export
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
  // Use the configured Neon adapter
  adapter: adapter,

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

        try {
          // Use the pool created outside the handler
          const { rows } = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [credentials.email]
          );
          const user = rows[0];

          if (!user || !user.password_hash) {
            console.log("Authorize: User not found or no password hash.");
            return null;
          }

          // Ensure email is verified (if your logic requires it)
          // if (!user.email_verified) {
          //   console.log("Authorize: Email not verified.");
          //   throw new Error("EMAIL_NOT_VERIFIED"); // Throwing error shows message on signin page
          // }

          const isValid = await verifyPassword(credentials.password, user.password_hash);

          if (!isValid) {
            console.log("Authorize: Invalid password.");
            return null;
          }

          console.log("Authorize: Credentials valid, returning user.");
          return {
            id: user.id.toString(), // Ensure ID is a string for NextAuth
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (dbError: any) {
             // Handle specific errors like "EMAIL_NOT_VERIFIED"
             if (dbError.message === "EMAIL_NOT_VERIFIED") {
                 throw dbError; // Re-throw to show on signin page
             }
          console.error("Database error during authorize:", dbError);
          // For generic errors, return null or throw a generic error
          // throw new Error("AUTHENTICATION_FAILED");
          return null; // Returning null shows a generic error message
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Add user ID from authorize or OAuth flow to the token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID from token to the session object
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
     // Add error page if you have one, to handle authorize throws
     error: '/auth/error', // Optional: route to display auth errors
  },

  secret: process.env.AUTH_SECRET,
};
