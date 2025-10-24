import { NextResponse } from "next/server"

const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"

let handler: any

if (isPreview) {
  // Return mock session endpoint for preview
  handler = async (request: Request) => {
    const url = new URL(request.url)

    // Handle session endpoint
    if (url.pathname.includes("/session")) {
      return NextResponse.json({ user: null })
    }

    // Handle other endpoints
    return NextResponse.json({ error: "NextAuth is disabled in preview mode" }, { status: 404 })
  }
} else {
  // Production: Use real NextAuth
  const NextAuth = require("next-auth").default
  const { authOptions } = require("@/lib/auth")

  handler = NextAuth(authOptions)
}

export { handler as GET, handler as POST }
