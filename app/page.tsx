import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If user is already signed in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <h1 className="text-4xl font-bold">Welcome to Mission and Door</h1>
        <p className="text-muted-foreground text-lg">Your personal kanban board for managing tasks and missions</p>
        <Link href="/auth/signin">
          <Button size="lg">Sign in to continue</Button>
        </Link>
      </div>
    </div>
  )
}
