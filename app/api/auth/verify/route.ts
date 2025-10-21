import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

const isPreview = !process.env.NEXTAUTH_SECRET

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  if (!token || !email) {
    return NextResponse.redirect(new URL("/auth/signin?error=InvalidToken", request.url))
  }

  if (isPreview) {
    return NextResponse.redirect(new URL("/auth/signin?verified=true&preview=true", request.url))
  }

  try {
    const [verification] = await sql`
      SELECT * FROM verification_tokens
      WHERE identifier = ${email} AND token = ${token} AND expires > NOW()
    `

    if (!verification) {
      return NextResponse.redirect(new URL("/auth/signin?error=InvalidToken", request.url))
    }

    await sql`
      UPDATE users 
      SET email_verified = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
    `

    await sql`
      DELETE FROM verification_tokens
      WHERE identifier = ${email} AND token = ${token}
    `

    return NextResponse.redirect(new URL("/auth/signin?verified=true", request.url))
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.redirect(new URL("/auth/signin?error=VerificationFailed", request.url))
  }
}
