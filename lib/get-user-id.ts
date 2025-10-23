"use server"

export async function getUserId(): Promise<string> {
  // Return a default user ID since we're not using authentication
  return "default-user"
}
