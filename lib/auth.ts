import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { Pool } from "@neondatabase/serverless"
import NeonAdapter from "@auth/neon-adapter"

console.log("=== AUTH INITIALIZATION DEBUG ===")
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL)
console.log("DATABASE_URL value:", process.env.DATABASE_URL?.substring(0, 20) + "...")
console.log("AUTH_SECRET exists:", !!process.env.AUTH_SECRET)
console.log("NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET)
console.log("GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID)
console.log("GOOGLE_CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET)

const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder"

// Initialize the Neon DB pool with error handling
let pool: Pool
try {
  pool = new Pool({ connectionString: databaseUrl })
} catch (error) {
  console.error("Failed to initialize database pool:", error)
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

const initializeAuth = () => {
  try {
    return NextAuth({
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      adapter: NeonAdapter(pool),
      session: { strategy: "jwt" },
      providers: [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        Credentials({
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
              const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [credentials.email as string])
              const user = rows[0]

              if (!user || !user.password_hash) {
                console.log("Authorize: User not found or no password hash.")
                return null
              }

              const isValid = await verifyPassword(credentials.password as string, user.password_hash)

              if (!isValid) {
                console.log("Authorize: Invalid password.")
                return null
              }

              console.log("Authorize: Credentials valid, returning user.")
              return {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: user.email_verified,
              }
            } catch (dbError) {
              console.error("Database error during authorize:", dbError)
              return null
            }
          },
        }),
      ],
      callbacks: {
        async session({ session, token }) {
          if (token.sub && session.user) {
            session.user.id = token.sub
          }
          return session
        },
        async jwt({ token, user }) {
          if (user) {
            token.sub = user.id
          }
          return token
        },
      },
      pages: {
        signIn: "/auth/signin",
      },
    })
  } catch (error) {
    console.error("Failed to initialize NextAuth:", error)
    console.error("Error details:", JSON.stringify(error, null, 2))
    return null
  }
}

const authResult = initializeAuth()

export const handlers = authResult?.handlers ?? {
  GET: async () => new Response("Auth not configured", { status: 500 }),
  POST: async () => new Response("Auth not configured", { status: 500 }),
}

export const auth = authResult?.auth ?? (async () => null)
export const signIn =
  authResult?.signIn ??
  (async () => {
    throw new Error("Auth not configured")
  })
export const signOut =
  authResult?.signOut ??
  (async () => {
    throw new Error("Auth not configured")
  })
