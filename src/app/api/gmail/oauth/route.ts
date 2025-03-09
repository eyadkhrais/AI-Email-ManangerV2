import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail/gmailClient';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Generate the authorization URL
    const authUrl = getAuthUrl();
    
    // Return the authorization URL
    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Error initiating Gmail OAuth:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Gmail OAuth' },
      { status: 500 }
    );
  }
} 