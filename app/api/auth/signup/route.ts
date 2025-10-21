import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

const isPreview =
  typeof window !== "undefined"
    ? window.location.hostname.includes("v0.app") || window.location.hostname.includes("vusercontent.net")
    : process.env.VERCEL_URL?.includes("v0.app") || process.env.VERCEL_URL?.includes("vusercontent.net")

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    if (isPreview) {
      return NextResponse.json({
        success: true,
        message: "Mock signup successful (preview mode). Deploy to production for real authentication.",
      })
    }

    const [existing] = await sql`SELECT * FROM users WHERE email = ${email}`
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // In production, you should use proper password hashing
    const password_hash = await hashPassword(password)

    const [user] = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name || null}, ${password_hash})
      RETURNING id, email, name
    `

    const token = generateToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO verification_tokens (identifier, token, expires)
      VALUES (${email}, ${token}, ${expires})
    `

    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}&email=${email}`

    return NextResponse.json({
      success: true,
      message: "Please check your email to verify your account",
      verifyUrl: process.env.NODE_ENV === "development" ? verifyUrl : undefined,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}
