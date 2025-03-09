import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7 // 7 days
};

export function createCookieOptions() {
  const cookieStore = cookies();
  const response = new NextResponse();

  return {
    cookies: {
      async get(name: string) {
        const cookie = await cookieStore.get(name);
        return cookie?.value;
      },
      set(name: string, value: string, options: any = {}) {
        response.cookies.set({
          name,
          value,
          ...COOKIE_OPTIONS,
          ...options
        });
      },
      remove(name: string, options: any = {}) {
        response.cookies.set({
          name,
          value: '',
          ...COOKIE_OPTIONS,
          ...options,
          maxAge: 0
        });
      },
    },
    response,
  };
} 