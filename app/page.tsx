import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to Mission and Door</h1>

        <SignedOut>
          <SignInButton mode="modal">
            <Button size="lg">Sign in to continue</Button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <Link href="/dashboard">
            <Button size="lg">Go to your dashboard</Button>
          </Link>
        </SignedIn>
      </div>
    </div>
  )
}
