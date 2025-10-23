"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "./auth"

export async function getSession() {
  try {
    const session = await getServerSession(authOptions)
    return session
  } catch (error) {
    console.error("[v0] Error getting session:", error)
    return null
  }
}
