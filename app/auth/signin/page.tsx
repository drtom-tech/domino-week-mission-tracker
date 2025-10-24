"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const MOCK_CREDENTIALS = {
  email: "test@example.com",
  password: "password123",
}

export default function SignInPage() {
  const router = useRouter()

  const handleEnterDashboard = () => {
    // Set auth flag for preview mode
    if (typeof window !== "undefined") {
      localStorage.setItem("preview-auth", "true")
    }
    // Redirect immediately
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>PREVIEW MODE - Dummy Login</strong>
            <br />
            <span className="text-sm">Click below to enter the dashboard. No authentication required in preview.</span>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Mission and Door</CardTitle>
            <CardDescription className="text-center">Preview Mode - Click to enter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleEnterDashboard} className="w-full" size="lg">
              Enter Dashboard
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              This is a simplified login for v0 preview only. Production uses real authentication.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
