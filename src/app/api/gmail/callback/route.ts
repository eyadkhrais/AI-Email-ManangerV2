import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/gmail/gmailClient';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?error=No authorization code provided', request.url));
    }
    
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=Authentication required', request.url));
    }
    
    // Exchange the authorization code for tokens
    const tokens = await getTokens(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL('/dashboard?error=Failed to get tokens', request.url));
    }
    
    // Store the tokens in the database
    const { error } = await supabase
      .from('gmail_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error storing Gmail tokens:', error);
      return NextResponse.redirect(new URL('/dashboard?error=Failed to store tokens', request.url));
    }
    
    // Redirect to the dashboard with a success message
    return NextResponse.redirect(new URL('/dashboard?success=Gmail connected successfully', request.url));
  } catch (error: any) {
    console.error('Error handling Gmail OAuth callback:', error);
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(error.message || 'Failed to connect Gmail')}`, request.url));
  }
} 