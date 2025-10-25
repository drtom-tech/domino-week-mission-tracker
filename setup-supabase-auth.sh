#!/bin/bash

# Supabase Auth Setup Script
# This script will install all the necessary files for Supabase Auth

echo "🚀 Setting up Supabase Auth..."
echo ""

PROJECT_ROOT="/Users/tomrolley/domino-week-mission-tracker-main"

# Create lib/supabase directory
echo "📁 Creating lib/supabase directory..."
mkdir -p "$PROJECT_ROOT/lib/supabase"

# Copy Supabase client files
echo "📄 Installing Supabase client files..."
cat > "$PROJECT_ROOT/lib/supabase/server.ts" << 'EOF'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Cookie setting can fail in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Cookie removal can fail in Server Components
          }
        },
      },
    }
  )
}
EOF

cat > "$PROJECT_ROOT/lib/supabase/client.ts" << 'EOF'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
EOF

# Update get-user-id
echo "📄 Updating get-user-id.ts..."
cat > "$PROJECT_ROOT/lib/get-user-id.ts" << 'EOF'
import { createClient } from '@/lib/supabase/server'

export async function getUserId() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  // Return the user's database ID (integer) from the users table
  // We need to look up the user by their Supabase auth ID
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()
  
  if (!dbUser) {
    throw new Error('User not found in database')
  }
  
  return dbUser.id
}
EOF

# Update middleware
echo "📄 Updating middleware.ts..."
cat > "$PROJECT_ROOT/middleware.ts" << 'EOF'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard and mission routes
  if (!user && (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/mission'))) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (user && request.nextUrl.pathname.startsWith('/auth/signin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/mission/:path*'],
}
EOF

# Create auth callback route
echo "📄 Creating auth callback route..."
mkdir -p "$PROJECT_ROOT/app/auth/callback"
cat > "$PROJECT_ROOT/app/auth/callback/route.ts" << 'EOF'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/signin?error=oauth_failed', request.url))
    }
  }

  // Redirect to dashboard after successful OAuth
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
EOF

echo ""
echo "✅ Supabase Auth files installed!"
echo ""
echo "Next steps:"
echo "1. Update your sign-in page to use Supabase Auth"
echo "2. Enable Google OAuth in Supabase Dashboard"
echo "3. Test the new auth flow"
echo ""
