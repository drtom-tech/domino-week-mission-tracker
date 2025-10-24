"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { CheckCircle, ArrowRight } from "lucide-react"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Mission and Door</h1>
          <p className="text-gray-600">Your personal mission and task tracker</p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Get started with your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Link href="/dashboard" className="block">
              <Button className="w-full" size="lg">
                Sign In to Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium text-center text-gray-700">What you'll get:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Track your weekly missions and goals</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Organize tasks with a Kanban board</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Stay focused on what matters most</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
