export function isPreviewEnvironment(): boolean {
  if (typeof window === "undefined") return false

  const hostname = window.location.hostname

  return (
    hostname.includes("v0.app") ||
    hostname.includes("vercel.app") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  )
}
