import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Get the token from the cookies
  const token = request.cookies.get('sb-access-token')?.value;

  // If the user is not signed in and the current path is not / or /login or /signup,
  // redirect the user to /login
  if (!token && 
      !pathname.startsWith('/login') && 
      !pathname.startsWith('/signup') &&
      !pathname.startsWith('/api/auth') &&
      !pathname.startsWith('/_next') &&
      !pathname.includes('.') &&
      pathname !== '/') {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If the user is signed in and the current path is /login or /signup,
  // redirect the user to /dashboard
  if (token && 
      (pathname.startsWith('/login') || 
       pathname.startsWith('/signup'))) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
}; 