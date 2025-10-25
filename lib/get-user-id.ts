import { createClient } from '@/lib/supabase/server'

export async function getUserId() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  // Look up user in our database by email
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()
  
  // If user doesn't exist in our database, create them
  if (!dbUser) {
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: user.email,
        name: user.user_metadata?.name || null,
        image: user.user_metadata?.avatar_url || null,
      })
      .select('id')
      .single()
    
    if (insertError || !newUser) {
      console.error('Error creating user record:', insertError)
      throw new Error('Failed to create user record')
    }
    
    return newUser.id
  }
  
  return dbUser.id
}
