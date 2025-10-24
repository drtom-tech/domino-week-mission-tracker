"use server"

import { authOptions } from "./auth"
import { cookies } from "next/headers"

export async function getUserId(): Promise<string> {
  console.log("[v0] getUserId called")

  const cookieStore = await cookies()
  const mockUser = cookieStore.get("mock-auth-user")

  console.log("[v0] Mock user cookie:", mockUser?.value)

  if (mockUser) {
    try {
      const user = JSON.parse(mockUser.value)
      console.log("[v0] getUserId returning mock user ID:", user.id)
      return user.id
    } catch (e) {
      console.error("[v0] Failed to parse mock user cookie:", e)
    }
  }

  try {
    const { getServerSession } = await import("next-auth")
    const session = await getServerSession(authOptions)

    if (session?.user?.id) {
      console.log("[v0] getUserId returning NextAuth user ID:", session.user.id)
      return session.user.id
    }
  } catch (error) {
    console.log("[v0] NextAuth not available, using fallback")
  }

  console.log("[v0] getUserId returning fallback: preview-user-1")
  return "preview-user-1"
}
