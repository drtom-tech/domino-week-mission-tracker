"use client"

// Helper function to sign out in both preview and production
export async function handleSignOut() {
  const isV0Preview =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.app") || window.location.hostname.includes("vusercontent.net"))

  if (isV0Preview) {
    // Preview mode: clear localStorage
    localStorage.removeItem("mock-auth-user")
    window.location.href = "/auth/signin"
  } else {
    // Production mode: use NextAuth signOut
    try {
      const { signOut } = await import("next-auth/react")
      await signOut({ callbackUrl: "/auth/signin" })
    } catch (error) {
      console.error("[v0] Error signing out:", error)
      // Fallback: clear localStorage and redirect
      localStorage.removeItem("mock-auth-user")
      window.location.href = "/auth/signin"
    }
  }
}
