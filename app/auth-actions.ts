// app/auth-actions.ts
"use server";

// Go up one level from `app` to the root
import { signIn, signOut } from "../auth"; 

export async function doSignIn() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function doSignOut() {
  await signOut({ redirectTo: "/" });
}