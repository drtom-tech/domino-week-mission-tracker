"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function getUserId(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const isPreview = host.includes("v0.app") || host.includes("vusercontent.net")

  if (isPreview) {
    console.log("[v0] Preview mode detected, using mock user ID")
    return "preview-user-1"
  }

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized - Please sign in")
  }

  return user.id
}
