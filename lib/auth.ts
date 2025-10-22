import { auth } from "@clerk/nextjs/server"

/**
 * Get the current authenticated user's Clerk ID
 * Throws an error if the user is not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized - Please sign in")
  }

  return userId
}

/**
 * Get the current authenticated user's Clerk ID
 * Returns null if the user is not authenticated
 */
export async function getAuthUserId() {
  const { userId } = await auth()
  return userId
}
