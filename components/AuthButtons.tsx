// components/AuthButtons.tsx
"use client";

import { useSession } from "next-auth/react";
// Go up one level (from `components`) and into `app`
import { doSignIn, doSignOut } from "../app/auth-actions"; 
// Go into the `ui` folder in this same directory
import { Button } from "./ui/button"; 
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  // Loading state
  if (status === "loading") {
    return <Skeleton className="w-24 h-10" />;
  }

  // Signed-in state
  if (session) {
    return (
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Avatar>
          <AvatarImage src={session.user?.image ?? ''} alt="User avatar" />
          <AvatarFallback>
            {session.user?.name?.charAt(0) ?? 'U'}
          </AvatarFallback>
        </Avatar>
        <form action={doSignOut}>
          <Button variant="ghost" type="submit">Sign Out</Button>
        </form>
      </div>
    );
  }

  // Signed-out state
  return (
    <form action={doSignIn}>
      <Button type="submit">Sign in with Google</Button>
    </form>
  );
}