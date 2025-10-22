// Path: app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db"; // Use the exported sql function

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Check for required parameters
  if (!token || !email) {
    console.error("Verification Error: Missing token or email");
    return NextResponse.redirect(new URL("/auth/signin?error=InvalidLink", request.url));
  }

  // Determine the environment using Vercel's standard variable
  const environment = process.env.VERCEL_ENV; // "production", "preview", or "development"
  console.log(`Verification attempt in environment: ${environment}`);

  try {
    // Find a matching, non-expired verification token using the sql tag
    const verifications = await sql`
      SELECT * FROM verification_tokens
      WHERE identifier = ${email} AND token = ${token} AND expires > NOW()
    `;

    const verification = verifications[0];

    // If no valid token is found
    if (!verification) {
      console.log(`Verification Error: Invalid or expired token for ${email}`);
      return NextResponse.redirect(new URL("/auth/signin?error=InvalidToken", request.url));
    }

    // Token is valid, update the user's email_verified status using the sql tag
    const userUpdateResult = await sql`
      UPDATE users
      SET email_verified = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
    `;

    // Check if the user was actually updated (rowCount might vary based on driver/library version)
    // A check for rowCount might be fragile; perhaps check if the user exists first.
    // For simplicity, we'll proceed assuming the user exists if the token was valid.
    if (userUpdateResult.count === 0) { // Adjust 'count' based on actual return object if different
         console.warn(`Verification Warning: Token was valid but no user found to update for email: ${email}`);
         // Redirecting with success might be okay if user verified via other means,
         // but an error might be safer if this is the only verification path.
         return NextResponse.redirect(new URL("/auth/signin?error=UserNotFound", request.url));
     }


    // Delete the used verification token using the sql tag
    await sql`
      DELETE FROM verification_tokens
      WHERE identifier = ${email} AND token = ${token}
    `;

    console.log(`Email successfully verified for: ${email}`);
    // Redirect to signin page with a success indicator
    return NextResponse.redirect(new URL("/auth/signin?verified=true", request.url));

  } catch (error) {
    console.error("Verification Route Database Error:", error);
    // Redirect to signin page with a generic failure indicator
    return NextResponse.redirect(new URL("/auth/signin?error=VerificationFailed", request.url));
  }
}

// **IMPORTANT**: Force this route to run on the Node.js runtime for database access
export const runtime = "nodejs";
