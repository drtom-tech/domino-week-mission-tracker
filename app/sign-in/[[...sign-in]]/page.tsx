"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  console.log("[v0] Sign-in page rendering")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
    </div>
  )
}
