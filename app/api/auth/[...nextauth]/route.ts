import { handlers } from "@/lib/auth"

export const GET = handlers.GET
export const POST = handlers.POST

// Ensure Node.js runtime for the Neon adapter
export const runtime = "nodejs"
