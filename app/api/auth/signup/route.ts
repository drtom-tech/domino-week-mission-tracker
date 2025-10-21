// Path: app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db"; // Ensure this path is correct for your DB connection

// Helper function to hash passwords using Web Crypto API (works in Node.js)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  // Using SubtleCrypto which is available globally in Node.js >= 15 and Vercel's Node.js runtime
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert buffer to hex string
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper function to generate tokens using Web Crypto API (works in Node.js)
function generateToken(): string {
  const array = new Uint8Array(32);
  // Using crypto.getRandomValues which is available globally in Node.js >= 15 and Vercel's Node.js runtime
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// The main POST handler for signup requests
export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash the password before storing
    const password_hash = await hashPassword(password);

    // Insert the new user into the database
    // Note: Assuming email verification is handled separately. Add email_verified = false if needed.
    const insertedUsers = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name || null}, ${password_hash})
      RETURNING id, email, name
    `;

    // Check if insertion was successful
    if (insertedUsers.length === 0) {
      throw new Error("User insertion failed.");
    }
    const newUser = insertedUsers[0];

    // --- Verification Token Logic (Optional - depends on your flow) ---
    // If you want email verification, generate and store a token
    // const token = generateToken();
    // const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    // await sql`
    //   INSERT INTO verification_tokens (identifier, token, expires)
    //   VALUES (${email}, ${token}, ${expires})
    // `;
    // const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}&email=${email}`;
    // You would typically send an email with this verifyUrl here
    // --- End Verification Token Logic ---

    // Return success (or the user object if needed, excluding sensitive info)
    return NextResponse.json({
      success: true,
      message: "Account created successfully.", // Adjust message if verification email sent
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      // verifyUrl: process.env.NODE_ENV === "development" ? verifyUrl : undefined, // Only expose in dev if needed
    });

  } catch (error) {
    console.error("Signup Route Error:", error);
    // Return a generic error message in production
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// **IMPORTANT**: Force this route to run on the Node.js runtime for database access
export const runtime = "nodejs";
