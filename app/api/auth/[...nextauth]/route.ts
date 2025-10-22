import { handlers } from "@/lib/auth"

export const GET = handlers?.GET ?? (async () => new Response("Auth not available", { status: 503 }))
export const POST = handlers?.POST ?? (async () => new Response("Auth not available", { status: 503 }))

export const runtime = "nodejs"
