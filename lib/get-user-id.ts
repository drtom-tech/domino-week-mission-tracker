"use server"

import { auth } from "@/auth"
import { headers } from "next/headers"

export async function getUserId(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const isPreview = host.includes("v0.app") || host.includes("vusercontent.net")

  // In preview mode, return a mock user ID for testing
  if (isPreview) {
    console.log("[v0] Preview mode detected, using mock user ID")
    return "preview-user-1"
  }

  // In production, use NextAuth authentication
  const session = await auth()

  if (!session?.user?.email) {
    throw new Error("Unauthorized - Please sign in")
  }

  // Use email as the user ID for NextAuth
  return session.user.email
}
