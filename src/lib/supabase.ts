import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for client-side usage
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Export the createClient function for components that need to create their own client
export { createClient }; 