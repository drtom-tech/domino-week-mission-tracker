// src/app/page.tsx
import AuthButtons from "@/components/AuthButtons";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to Mission and Door</h1>
        
        {/* This one component handles both signed-in and signed-out states */}
        <AuthButtons />
        
      </div>
    </div>
  )
}