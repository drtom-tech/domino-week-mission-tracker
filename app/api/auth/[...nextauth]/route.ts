import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

console.log("[v0] Route file loading...")
console.log("[v0] AUTH_SECRET exists:", !!process.env.AUTH_SECRET)
console.log("[v0] GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID)
console.log("[v0] GOOGLE_CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET)

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: true,
})

export { handler as GET, handler as POST }
export const runtime = "nodejs"
