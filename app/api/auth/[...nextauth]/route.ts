const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true"

let GET: any
let POST: any

if (IS_PREVIEW) {
  GET = async () => {
    return new Response(JSON.stringify({ error: "Preview mode - auth disabled" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  POST = async () => {
    return new Response(JSON.stringify({ error: "Preview mode - auth disabled" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }
} else {
  const NextAuth = require("next-auth")
  const { authOptions } = require("@/lib/auth")

  const handler = NextAuth.default(authOptions)

  GET = handler
  POST = handler
}

export { GET, POST }
