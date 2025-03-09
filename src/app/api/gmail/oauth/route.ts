import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail/gmailClient';
import { createServerClient } from '@supabase/ssr';
import { createCookieOptions } from '@/lib/supabase/cookies';

export async function GET() {
  try {
    const { cookies, response } = createCookieOptions();

    // Create a Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
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
    
    // Return the authorization URL with any cookies that were set
    const jsonResponse = NextResponse.json({ authUrl });
    response.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie);
    });
    return jsonResponse;
  } catch (error: any) {
    console.error('Error initiating Gmail OAuth:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Gmail OAuth' },
      { status: 500 }
    );
  }
} 