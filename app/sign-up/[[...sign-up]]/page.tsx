"use client"

import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  console.log("[v0] Sign-up page rendering")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
    </div>
  )
}
