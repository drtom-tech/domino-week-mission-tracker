import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { sql } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }
        const bcrypt = await import("bcryptjs")
        const [user] = await sql`
          SELECT * FROM users WHERE email = ${credentials.email}
        `
        if (!user) {
          throw new Error("No user found with this email")
        }
        if (!user.email_verified) {
          throw new Error("Please verify your email before logging in")
        }
        if (!user.password_hash) {
          throw new Error("Please sign in with Google")
        }
        const isValid = await bcrypt.default.compare(credentials.password, user.password_hash)
        if (!isValid) {
          throw new Error("Invalid password")
        }
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account?.provider === "google" && user) {
        // Store Google user in database
        try {
          const existingUser = await sql`
            SELECT * FROM users WHERE email = ${user.email}
          `
          if (existingUser.length === 0) {
            await sql`
              INSERT INTO users (email, name, image, email_verified)
              VALUES (${user.email}, ${user.name}, ${user.image}, true)
            `
          }
        } catch (error) {
          console.error("Error storing Google user:", error)
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
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
