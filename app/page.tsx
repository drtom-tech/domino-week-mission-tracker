export default function Page() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Mission and Door</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your authentication is powered by Clerk. Sign in to get started.
        </p>
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
          <p className="text-muted-foreground">Click the "Sign In" button in the header to authenticate with Clerk.</p>
        </div>
      </div>
    </main>
  )
}
