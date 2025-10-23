// app/api/auth/[...nextauth]/route.ts

// Go up from `app/api/auth/[...nextauth]` to the root
import { handlers } from "../../../../auth";

export const { GET, POST } = handlers;