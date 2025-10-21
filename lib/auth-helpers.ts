"use client"

const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.app")

export async function signInWithCredentials(email: string, password: string) {
  console.log("[v0] signInWithCredentials called, isPreview:", isPreview)

  if (isPreview) {
    // Use mock auth in preview
    const mockUser = { id: "preview-user", email, name: email.split("@")[0] }
    localStorage.setItem("mock-auth-user", JSON.stringify(mockUser))
    window.dispatchEvent(new Event("storage"))
    return { error: null }
  } else {
    // Dynamically import NextAuth only in production
    const { signIn } = await import("next-auth/react")
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    return { error: result?.error || null }
  }
}

export async function signInWithGoogle() {
  console.log("[v0] signInWithGoogle called, isPreview:", isPreview)
  console.log("[v0] hostname:", typeof window !== "undefined" ? window.location.hostname : "server")

  if (isPreview) {
    const mockUser = { id: "preview-user-google", email: "user@example.com", name: "Preview User" }
    localStorage.setItem("mock-auth-user", JSON.stringify(mockUser))
    window.dispatchEvent(new Event("storage"))
    // Redirect to home page
    window.location.href = "/"
    return { error: null }
  } else {
    // Dynamically import NextAuth only in production
    const { signIn } = await import("next-auth/react")
    await signIn("google", { callbackUrl: "/" })
    return { error: null }
  }
}

export async function signUpWithCredentials(email: string, password: string, name: string) {
  if (isPreview) {
    // Mock signup in preview
    const mockUser = { id: "preview-user", email, name }
    localStorage.setItem("mock-auth-user", JSON.stringify(mockUser))
    return { error: null, success: true }
  } else {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to parse JSON error, fallback to status text
        try {
          const data = await response.json()
          return { error: data.error || "Failed to create account", success: false }
        } catch {
          return { error: `Server error: ${response.statusText}`, success: false }
        }
      }

      const data = await response.json()
      return { error: data.error || null, success: !data.error }
    } catch (error) {
      console.error("[v0] Signup error:", error)
      return { error: "Network error. Please try again.", success: false }
    }
  }
}

export async function signOutUser() {
  if (isPreview) {
    localStorage.removeItem("mock-auth-user")
    window.location.href = "/auth/signin"
  } else {
    const { signOut } = await import("next-auth/react")
    await signOut({ callbackUrl: "/auth/signin" })
  }
}
