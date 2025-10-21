// Path: app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth" // Make sure this path is correct

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

export const runtime = "nodejs"
