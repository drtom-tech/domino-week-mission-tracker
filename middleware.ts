import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname
  const isPreview =
    hostname.includes("v0.app") ||
    hostname.includes("vusercontent.net") ||
    hostname.includes("vercel.app") ||
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1")

  if (isPreview) {
    return NextResponse.next()
  }

  const token =
    request.cookies.get("next-auth.session-token") || request.cookies.get("__Secure-next-auth.session-token")

  const isAuthenticated = !!token

  // Redirect to signin if not authenticated and trying to access protected routes
  if (
    !isAuthenticated &&
    (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/mission"))
  ) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect to home if authenticated and trying to access signin
  if (isAuthenticated && request.nextUrl.pathname === "/auth/signin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/mission/:path*", "/auth/signin"],
}
