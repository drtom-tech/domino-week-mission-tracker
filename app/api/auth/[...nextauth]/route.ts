// Path: app/api/auth/[...nextauth]/route.ts
export { handlers as GET, handlers as POST } from "@/lib/auth"; // Adjust path if needed

// Ensure Node.js runtime for the Neon adapter
export const runtime = "nodejs";
