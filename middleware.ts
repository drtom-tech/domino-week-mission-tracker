import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE !== "false"

export async function middleware(request: NextRequest) {
  // In preview mode, allow all requests through without auth checks
  if (IS_PREVIEW) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
