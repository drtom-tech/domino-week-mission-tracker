import { SignedIn, SignedOut } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Mission and Door</h1>
          <p className="text-slate-600">Your personal mission and task tracker</p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignedOut>
              <div className="flex justify-center">
                <Link href="/auth/signin">
                  <Button size="lg" className="border-2 border-slate-300 rounded-lg px-8">
                    Sign In with Google
                  </Button>
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-3 text-center">What you'll get:</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Track your weekly missions and goals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Organize tasks with a Kanban board</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Stay focused on what matters most</span>
                  </li>
                </ul>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="space-y-3">
                <p className="text-center text-slate-700">You're already signed in!</p>
                <Link href="/dashboard" className="block">
                  <Button size="lg" className="w-full">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </SignedIn>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">Secure authentication powered by Clerk</p>
      </div>
    </div>
  )
}
