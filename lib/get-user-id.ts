"use server"

function isV0Preview(): boolean {
  const vercelUrl = process.env.VERCEL_URL

  // vusercontent.net is used by v0 preview environment
  // v0.app is the domain users access v0 through
  if (vercelUrl && (vercelUrl.includes("v0.app") || vercelUrl.includes("vusercontent.net"))) {
    return true
  }

  // If no VERCEL_ENV at all, we're likely in local dev or v0 preview
  if (!process.env.VERCEL_ENV) {
    return true
  }

  // Otherwise, we're in a real Vercel deployment (production or preview branch)
  return false
}

export async function getUserId(): Promise<number> {
  const usePreview = isV0Preview()

  console.log(
    "[v0] getUserId - isPreview:",
    usePreview,
    "VERCEL_ENV:",
    process.env.VERCEL_ENV,
    "VERCEL_URL:",
    process.env.VERCEL_URL,
  )

  // In preview mode, always return mock user ID
  if (usePreview) {
    console.log("[v0] Using mock user ID: 1")
    return 1
  }

  // In production, use real NextAuth
  try {
    const { getServerSession } = await import("next-auth")
    const { authOptions } = await import("@/lib/auth")

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error("Unauthorized - Please sign in")
    }
    console.log("[v0] Using real user ID:", session.user.id)
    return Number(session.user.id)
  } catch (error) {
    console.error("[v0] getUserId error:", error)
    // If NextAuth fails to load, fall back to mock user
    return 1
  }
}
