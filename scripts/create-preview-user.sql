-- Create a dedicated preview/test user for v0 preview mode
-- This ensures preview operations don't affect production user data

-- Insert preview user if it doesn't exist
INSERT INTO users (email, name, email_verified, created_at, updated_at)
VALUES (
  'preview@v0.test',
  'Preview User',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Return the preview user's ID
SELECT id, email, name FROM users WHERE email = 'preview@v0.test';
