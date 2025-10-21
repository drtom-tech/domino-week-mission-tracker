import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { sql } from "@/lib/db"

function isV0Preview() {
  const vercelUrl = process.env.VERCEL_URL || ""
  return vercelUrl.includes("vusercontent.net") || vercelUrl.includes("v0.app")
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const computedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return computedHash === hash
}

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
            return null
          }

          // In preview mode, return a mock user for any credentials
          if (isV0Preview()) {
            console.log("[v0] Auth in preview mode - using mock user")
            return {
              id: "1",
              email: credentials.email,
              name: "Preview User",
              image: null,
            }
          }

          const [user] = await sql`
            SELECT * FROM users WHERE email = ${credentials.email}
          `

          if (!user || !user.password_hash) {
            return null
          }

          if (!user.email_verified) {
            throw new Error("Please verify your email")
          }

          const isValid = await verifyPassword(credentials.password, user.password_hash)
          if (!isValid) {
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error("[v0] Auth error:", error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Skip database operations in preview mode
        if (isV0Preview()) {
          console.log("[v0] SignIn callback in preview mode - skipping database")
          return true
        }

        // Handle Google OAuth user creation
        if (account?.provider === "google") {
          const [existingUser] = await sql`
            SELECT * FROM users WHERE email = ${user.email}
          `

          if (!existingUser) {
            // Create new user
            const [newUser] = await sql`
              INSERT INTO users (email, name, image, email_verified)
              VALUES (${user.email}, ${user.name}, ${user.image}, CURRENT_TIMESTAMP)
              RETURNING *
            `
            user.id = newUser.id.toString()

            // Create account record
            await sql`
              INSERT INTO accounts (
                user_id, type, provider, provider_account_id,
                access_token, expires_at, token_type, scope, id_token
              ) VALUES (
                ${newUser.id}, ${account.type}, ${account.provider},
                ${account.providerAccountId}, ${account.access_token},
                ${account.expires_at}, ${account.token_type},
                ${account.scope}, ${account.id_token}
              )
            `
          } else {
            user.id = existingUser.id.toString()
          }
        }
        return true
      } catch (error) {
        console.error("[v0] SignIn callback error:", error)
        // Return true in preview mode to allow sign in despite errors
        return isV0Preview()
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      return token
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
}
