import type { NextAuthOptions } from "next-auth"
import GoogleProviderModule from "next-auth/providers/google"
import CredentialsProviderModule from "next-auth/providers/credentials"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const resolveProvider = (module: any) => {
  // Try different possible module structures
  if (typeof module === "function") return module
  if (typeof module?.default === "function") return module.default
  if (typeof module?.default?.default === "function") return module.default.default
  // Fallback to the module itself
  return module
}

const GoogleProvider = resolveProvider(GoogleProviderModule)
const CredentialsProvider = resolveProvider(CredentialsProviderModule)

const sql = neon(process.env.DATABASE_URL!)

export const authOptions: NextAuthOptions = {
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
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[v0] Missing email or password credentials")
            return null
          }

          const users = await sql`
            SELECT * FROM users WHERE email = ${credentials.email}
          `

          if (users.length === 0) {
            console.log("[v0] No user found with email:", credentials.email)
            return null
          }

          const user = users[0]

          // Validate user object has required fields
          if (!user.password_hash) {
            console.error("[v0] User record missing password_hash field for email:", credentials.email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash)

          if (!isPasswordValid) {
            console.log("[v0] Invalid password for email:", credentials.email)
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("[v0] Authorization error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account?.provider === "google") {
        try {
          // Handle Google OAuth user creation/lookup
          const users = await sql`
            SELECT * FROM users WHERE email = ${user.email}
          `
          if (users.length === 0) {
            const newUsers = await sql`
              INSERT INTO users (email, name, password_hash)
              VALUES (${user.email}, ${user.name}, '')
              RETURNING id
            `
            token.id = newUsers[0].id.toString()
          } else {
            token.id = users[0].id.toString()
          }
        } catch (error) {
          console.error("[v0] JWT callback error:", error)
          // Keep existing token.id if available
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
