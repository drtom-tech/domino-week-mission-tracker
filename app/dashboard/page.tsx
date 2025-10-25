"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/use-auth"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"

const Menu = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const ChevronLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

type Task = {
  id: string
  title: string
  status: "backlog" | "todo" | "in-progress" | "done"
}

export default function Dashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Welcome to your dashboard", status: "todo" },
    { id: "2", title: "Create your first task", status: "backlog" },
    { id: "3", title: "Organize your work", status: "backlog" },
  ])

  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [weekOffset, setWeekOffset] = useState(0)

  const addTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      status: "backlog",
    }

    setTasks([...tasks, newTask])
    setNewTaskTitle("")
  }

  const moveTask = (taskId: string, newStatus: Task["status"]) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
  }

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status)
  }

  const getWeekLabel = () => {
    const today = new Date()
    today.setDate(today.getDate() + weekOffset * 7)
    return `Week of ${today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  }

  if (authLoading) {
    console.log("[v0] Dashboard showing loading state")
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Mission and Door</CardTitle>
            <CardDescription className="text-center">Sign in to access your kanban board</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                >
                  <span className="mr-2 h-4 w-4">Chrome Icon</span>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const email = formData.get("email") as string
                    const password = formData.get("password") as string

                    try {
                      const result = await signIn("credentials", {
                        email,
                        password,
                        redirect: false,
                      })

                      if (result?.error) {
                        toast.error("Invalid email or password")
                      } else {
                        router.refresh()
                      }
                    } catch (error) {
                      console.error("Sign in error:", error)
                      toast.error("An error occurred during sign in")
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" name="email" type="email" placeholder="you@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                >
                  <span className="mr-2 h-4 w-4">Chrome Icon</span>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const email = formData.get("email") as string
                    const password = formData.get("password") as string
                    const name = formData.get("name") as string

                    try {
                      const response = await fetch("/api/auth/signup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password, name }),
                      })

                      const data = await response.json()

                      if (!response.ok) {
                        toast.error(data.error || "Failed to create account")
                        return
                      }

                      toast.success("Account created! Signing you in...")

                      const result = await signIn("credentials", {
                        email,
                        password,
                        redirect: false,
                      })

                      if (result?.error) {
                        toast.error("Account created but failed to sign in. Please try signing in manually.")
                      } else {
                        router.refresh()
                      }
                    } catch (error) {
                      console.error("Sign up error:", error)
                      toast.error("An error occurred during sign up")
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Name (optional)</Label>
                    <Input id="signup-name" name="name" type="text" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="you@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="password" type="password" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Personal Kanban</h1>

            {/* Week Navigator */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">{getWeekLabel()}</span>
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Link href="/mission">
              <Button variant="outline">Mission Board</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Add Task */}
        <div className="mb-6 bg-white p-4 rounded-lg border">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a new task..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={addTask}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Backlog Column */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-semibold text-gray-700 mb-4">Backlog ({getTasksByStatus("backlog").length})</h2>
            <div className="space-y-2">
              {getTasksByStatus("backlog").map((task) => (
                <div key={task.id} className="bg-gray-50 p-3 rounded border">
                  <p className="text-sm mb-2">{task.title}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveTask(task.id, "todo")}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      To Do
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* To Do Column */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-semibold text-gray-700 mb-4">To Do ({getTasksByStatus("todo").length})</h2>
            <div className="space-y-2">
              {getTasksByStatus("todo").map((task) => (
                <div key={task.id} className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm mb-2">{task.title}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveTask(task.id, "in-progress")}
                      className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => moveTask(task.id, "backlog")}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-semibold text-gray-700 mb-4">In Progress ({getTasksByStatus("in-progress").length})</h2>
            <div className="space-y-2">
              {getTasksByStatus("in-progress").map((task) => (
                <div key={task.id} className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm mb-2">{task.title}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveTask(task.id, "done")}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => moveTask(task.id, "todo")}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-semibold text-gray-700 mb-4">Done ({getTasksByStatus("done").length})</h2>
            <div className="space-y-2">
              {getTasksByStatus("done").map((task) => (
                <div key={task.id} className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-sm mb-2 line-through text-gray-600">{task.title}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
