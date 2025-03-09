import { supabase } from './supabase';

export async function getUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error in getUser:', error);
    return null;
  }
} 