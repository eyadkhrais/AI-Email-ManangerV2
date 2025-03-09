import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create a response to modify Set-Cookie header if needed
  const response = NextResponse.next();

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // In middleware, we must use response.cookies.set()
            response.cookies.set({
              name,
              value,
              ...options,
              // Ensure cookies work in development and production
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            });
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              path: '/',
              expires: new Date(0)
            });
          },
        },
      }
    );

    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession();

    // Define public routes that don't require authentication
    const isPublicRoute = 
      pathname === '/' || 
      pathname.startsWith('/login') || 
      pathname.startsWith('/signup') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/_next') ||
      pathname.includes('.');

    // If no session and trying to access protected route, redirect to login
    if (!session && !isPublicRoute) {
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // If session exists and trying to access auth routes, redirect to dashboard
    if (session && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
      const redirectUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // If there's an error, assume not authenticated
    const isPublicPath = 
      pathname === '/' || 
      pathname.startsWith('/login') || 
      pathname.startsWith('/signup') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/_next') ||
      pathname.includes('.');

    if (!isPublicPath) {
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    return response;
  }
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
}; 