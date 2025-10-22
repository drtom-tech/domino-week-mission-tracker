import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { NeonAdapter } from "@auth/neon-adapter"
import { Pool } from "@neondatabase/serverless"

console.log("[v0] Route file loading...")
console.log("[v0] AUTH_SECRET exists:", !!process.env.AUTH_SECRET)
console.log("[v0] GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID)
console.log("[v0] GOOGLE_CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET)
console.log("[v0] DATABASE_URL exists:", !!process.env.DATABASE_URL)

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const computedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return computedHash === hash
}

const handler = NextAuth({
  adapter: NeonAdapter(pool),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [credentials.email])
          const user = rows[0]

          if (!user || !user.password_hash) {
            return null
          }

          const isValid = await verifyPassword(credentials.password as string, user.password_hash)

          if (!isValid) {
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            emailVerified: user.email_verified,
          }
        } catch (error) {
          console.error("[v0] Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: { strategy: "database" },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: true,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Check if user with this email already exists
        const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [user.email])

        if (rows.length > 0) {
          // Link the Google account to existing user
          user.id = rows[0].id.toString()
        }
      }
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
})

export { handler as GET, handler as POST }
export const runtime = "nodejs"
