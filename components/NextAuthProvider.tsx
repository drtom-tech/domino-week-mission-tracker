"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { type Session } from "next-auth"; // Import Session type from next-auth

// --- Mock Session Logic (for v0 editor/localhost) ---
type MockSessionContextType = {
  data: Session | null;
  status: "authenticated" | "loading" | "unauthenticated";
};

const MockSessionContext = createContext<MockSessionContextType>({
  data: null,
  status: "unauthenticated",
});

export function MockSessionProvider({ children }: { children: ReactNode }) {
  const mockSessionData: Session = {
    user: {
      id: "mock-user-id-123", // Use a more distinct ID
      name: "Preview User",
      email: "preview@example.com",
      image: undefined, // Or a placeholder image URL
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Standard expiry
  };

  return (
    <MockSessionContext.Provider
      value={{
        data: mockSessionData,
        status: "authenticated", // Simulate logged-in state
      }}
    >
      {children}
    </MockSessionContext.Provider>
  );
}
// --- End Mock Session Logic ---


// --- Provider Switch Logic ---

// Dynamically import the real SessionProvider only when needed
const RealSessionProvider = dynamic(
  () => import("next-auth/react").then((mod) => mod.SessionProvider),
  {
    ssr: false, // Session provider is client-side
    loading: () => <p>Loading session...</p>, // Optional loading state
  }
);

// Simplified function to detect ONLY v0 editor or localhost
function shouldUseMockProvider(): boolean {
  // Return false during Server-Side Rendering or Static Generation
  if (typeof window === "undefined") {
      console.log("[v0] SSR detected, using Real Provider placeholder");
      return false;
  }

  const hostname = window.location.hostname;
  const useMock = hostname.includes("v0.app") || hostname.includes("localhost");

  console.log("[v0] Should use mock provider?", { hostname, useMock });
  return useMock;
}


// Main provider component
export default function NextAuthProvider({ children }: { children: ReactNode }) {
  // Use state to manage which provider to render, prevents hydration mismatch
  const [useMock, setUseMock] = useState<boolean | null>(null); // Start with null state

  useEffect(() => {
    // Determine which provider to use ONLY on the client-side
    setUseMock(shouldUseMockProvider());
  }, []); // Empty dependency array ensures this runs only once on mount


  // Render loading state or null initially until client-side check completes
  if (useMock === null) {
      console.log("[v0] Initializing provider check...");
      // You might want a loading spinner here, or just null
      return null;
  }

  // Render Mock provider if needed
  if (useMock) {
    console.log("[v0] Using MockSessionProvider");
    return <MockSessionProvider>{children}</MockSessionProvider>;
  }

  // Otherwise, render the Real provider
  console.log("[v0] Using RealSessionProvider (NextAuth)");
  return <RealSessionProvider>{children}</RealSessionProvider>;
}
