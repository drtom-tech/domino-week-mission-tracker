"use client"

import { SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function SignInButtonWrapper() {
  return (
    <SignInButton mode="modal">
      <Button size="lg">Sign In</Button>
    </SignInButton>
  )
}
