"use server"

import { sql } from "@/lib/db"

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

  if (usePreview) {
    try {
      // Get the preview user from the database
      const result = await sql`
        SELECT id FROM users WHERE email = 'preview@v0.test' LIMIT 1
      `

      if (result && result.length > 0) {
        const previewUserId = Number(result[0].id)
        console.log("[v0] Using preview user ID:", previewUserId)
        return previewUserId
      } else {
        console.warn("[v0] Preview user not found in database, falling back to ID 1")
        return 1
      }
    } catch (error) {
      console.error("[v0] Error fetching preview user:", error)
      return 1
    }
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
