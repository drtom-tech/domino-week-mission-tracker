import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

function isV0Preview(req: Request) {
  const url = new URL(req.url)
  return url.hostname.includes("vusercontent.net") || url.hostname.includes("v0.app")
}

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isV0Preview(req)) {
    return
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
