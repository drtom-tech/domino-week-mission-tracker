// Path: lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials" // Note: v5 uses Credentials directly
import { Pool } from "@neondatabase/serverless"
import NeonAdapter from "@auth/neon-adapter"

const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder"

// Initialize the Neon DB pool with error handling
let pool: Pool
try {
  pool = new Pool({ connectionString: databaseUrl })
} catch (error) {
  console.error("Failed to initialize database pool:", error)
  // Create a dummy pool that won't be used during build
  pool = new Pool({ connectionString: "postgresql://placeholder" })
}

// Helper function to verify password hash using Web Crypto API
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const computedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return computedHash === hash
}

let authConfig
try {
  authConfig = NextAuth({
    adapter: NeonAdapter(pool),
    session: { strategy: "jwt" }, // JWT is recommended for serverless
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      }),
      Credentials({
        // The name 'credentials' is used in the signIn function
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            console.log("Authorize: Missing credentials")
            return null
          }

          try {
            const { rows } = await pool.query(
              "SELECT * FROM users WHERE email = $1",
              [credentials.email as string], // Cast needed for v5 type safety
            )
            const user = rows[0]

            if (!user || !user.password_hash) {
              console.log("Authorize: User not found or no password hash.")
              return null
            }

            const isValid = await verifyPassword(credentials.password as string, user.password_hash) // Cast needed

            if (!isValid) {
              console.log("Authorize: Invalid password.")
              return null
            }

            console.log("Authorize: Credentials valid, returning user.")
            // Must return an object matching the User type expected by Auth.js v5 AdapterUser
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: user.email_verified, // Pass emailVerified status
            }
          } catch (dbError) {
            console.error("Database error during authorize:", dbError)
            return null // Returning null shows a generic error
          }
        },
      }),
    ],
    callbacks: {
      // Session callback gets token, user, session
      // User object comes from adapter or authorize, token comes from jwt callback
      async session({ session, token }) {
        // Add user ID and potentially other token data to session
        if (token.sub && session.user) {
          session.user.id = token.sub // Use token.sub for user ID in JWT strategy
        }
        // Add custom fields from token if needed
        // if (token.customField && session.user) {
        //   session.user.customField = token.customField;
        // }
        return session
      },
      // JWT callback gets token, user, account, profile, isNewUser
      // User object only passed on initial sign in
      async jwt({ token, user, account, profile }) {
        // Persist the user ID from user obj (on sign in) to the token
        if (user) {
          token.sub = user.id // Standard JWT subject claim
        }
        // Add custom fields to token if needed
        // if (account?.provider === "google") {
        //    token.accessToken = account.access_token; // Example: Persist access token
        // }
        return token
      },
    },
    pages: {
      signIn: "/auth/signin",
      // error: '/auth/error', // Optional
    },
    // secret is automatically read from AUTH_SECRET in v5
  })
} catch (error) {
  console.error("Failed to initialize NextAuth:", error)
  // Provide fallback handlers for build-time
  authConfig = {
    handlers: {
      GET: async () => new Response("Auth not configured", { status: 500 }),
      POST: async () => new Response("Auth not configured", { status: 500 }),
    },
    auth: async () => null,
    signIn: async () => {
      throw new Error("Auth not configured")
    },
    signOut: async () => {
      throw new Error("Auth not configured")
    },
  }
}

export const { handlers, auth, signIn, signOut } = authConfig
