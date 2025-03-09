import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createCookieOptions } from '@/lib/supabase/cookies';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // If there's an error from the OAuth provider, log it and redirect to login
  if (error || error_description) {
    console.error('OAuth error:', { error, error_description });
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error || 'Authentication failed')}`, requestUrl.origin)
    );
  }

  if (code) {
    try {
      const { cookies, response } = createCookieOptions();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies }
      );
      
      // Exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        );
      }

      // Verify the session was created
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Error getting session:', sessionError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(sessionError?.message || 'Failed to create session')}`, requestUrl.origin)
        );
      }

      // Create the redirect response
      const redirectUrl = new URL('/dashboard', requestUrl.origin);
      const redirectResponse = NextResponse.redirect(redirectUrl);

      // Copy any cookies that were set
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie);
      });

      return redirectResponse;
    } catch (error: any) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message || 'An unexpected error occurred')}`, requestUrl.origin)
      );
    }
  }

  // If no code is present, redirect to login with an error
  console.error('No authorization code provided');
  return NextResponse.redirect(
    new URL('/login?error=No authorization code provided', requestUrl.origin)
  );
} 