# Development Mode Setup Guide

## Overview

This guide will help you set up a dedicated test user space in Supabase to separate real data from test data during development.

## Problem

Previously, dev mode was using `user_id = 1`, which could be a real user's data (e.g., drtom@graduatemedicine.com). This created a risk of mixing real and test data.

## Solution

We now use a dedicated test user email that you configure in your environment variables.

## Setup Steps

### 1. Create a Test User in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add User** (or invite user)
4. Create a user with a test email, for example:
   - Email: `test-user@example.com`
   - Password: Choose a secure password for testing
   - Or you can use: `dev-test@yourdomain.com`

**Important:** Use a clearly identifiable test email address, NOT a real user's email.

### 2. Verify the User Exists in the Users Table

1. Navigate to **Table Editor** > **users** table
2. Verify that your test user appears in the table
3. Note the user's `id` (you don't need to do anything with it, but it's good to verify it exists)

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and set the following variables:

   ```env
   # Supabase Configuration (get these from your Supabase project settings)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Enable development mode
   NEXT_PUBLIC_DEV_MODE=true

   # Set your test user email (MUST match the email you created in step 1)
   DEV_TEST_USER_EMAIL=test-user@example.com
   ```

   **Note:** `DEV_TEST_USER_EMAIL` should only be set on the **server side** (it's not prefixed with `NEXT_PUBLIC_` for security reasons).

### 4. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. Click **"Skip Login (Dev Mode)"**

4. You should now be logged in as the test user

5. Check the browser console - you should see a log message like:
   ```
   [DEV MODE] Using test user ID: 123 (test-user@example.com)
   ```

6. Any tasks or data you create will now be associated with the test user, not real users

## Troubleshooting

### Error: "Test user not found"

If you see this error, it means:
- The test user doesn't exist in the `users` table in Supabase, OR
- The email in `DEV_TEST_USER_EMAIL` doesn't match the email you created

**Solution:**
1. Double-check the email address in your `.env.local` file
2. Verify the user exists in Supabase Authentication
3. Verify the user exists in the `users` table in Table Editor

### Dev mode is not working

1. Verify `NEXT_PUBLIC_DEV_MODE=true` is set in `.env.local`
2. Restart your development server after changing `.env.local`
3. Clear your browser's localStorage (Dev Tools > Application > Local Storage)

## Production Deployment

**Important:** When deploying to production:

1. Set `NEXT_PUBLIC_DEV_MODE=false` in your production environment variables (or don't set it at all)
2. Do NOT set `DEV_TEST_USER_EMAIL` in production
3. Ensure proper authentication is enabled

## Security Notes

- The test user email should only be used for development
- Never use production user emails for testing
- The `DEV_TEST_USER_EMAIL` variable is server-side only to prevent exposure
- Dev mode is automatically disabled in production when `NEXT_PUBLIC_DEV_MODE` is not set to "true"

## Benefits

- **Data Isolation:** Real user data is never affected during development
- **Consistent Testing:** All developers can use the same test user setup
- **Easy Cleanup:** You can delete all test user data without affecting real users
- **Clear Separation:** Test data is clearly identifiable by the test email address
