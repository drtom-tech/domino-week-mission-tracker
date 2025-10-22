// Path: lib/use-auth.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import type { Session } from "next-auth"; // Optional: Import Session type for better typing

// This hook now acts as a simple wrapper around the real useSession hook from next-auth/react
export function useAuth() {
  const { data: session, status } = useSession();

  // Determine user object based on session data
  const user = session?.user ?? null;

  return {
    data: session, // The full session object (or null)
    status: status, // "loading", "authenticated", or "unauthenticated"
    user: user,     // The user object (or null)
    signIn,         // The real signIn function from next-auth/react
    signOut,        // The real signOut function from next-auth/react
  };
}

// You can optionally create more specific hooks if needed, e.g.:
// export function useUser() {
//   const { data: session, status } = useSession();
//   if (status === "loading") {
//     return { user: null, isLoading: true };
//   }
//   return { user: session?.user ?? null, isLoading: false };
// }
