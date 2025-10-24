import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true"

export async function middleware(request: NextRequest) {
  // In preview mode, allow all requests through without authentication
  if (IS_PREVIEW) {
    return NextResponse.next()
  }

  // In production, use NextAuth middleware
  try {
    const { default: withAuth } = await import("next-auth/middleware")
    const authMiddleware = withAuth({
      pages: {
        signIn: "/auth/signin",
      },
    })
    return authMiddleware(request as any)
  } catch (error) {
    console.error("[v0] NextAuth middleware error:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
