"use server"

import { authOptions } from "./auth"
import { cookies } from "next/headers"

export async function getUserId(): Promise<string> {
  const cookieStore = await cookies()
  const mockUser = cookieStore.get("mock-auth-user")

  if (mockUser) {
    try {
      const user = JSON.parse(mockUser.value)
      return user.id
    } catch (e) {
      console.error("[v0] Failed to parse mock user cookie:", e)
    }
  }

  try {
    const { getServerSession } = await import("next-auth")
    const session = await getServerSession(authOptions)

    if (session?.user?.id) {
      return session.user.id
    }
  } catch (error) {
    console.log("[v0] NextAuth not available, using mock auth")
  }

  return "preview-user-1"
}
