'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

const COOKIE_NAMES = [
  'sb-access-token',
  'sb-refresh-token',
  'supabase-auth-token'
];

export default function DashboardHeader() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    try {
      // First clear any session data
      await supabase.auth.signOut();
      
      // Clear any client-side storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Remove specific auth cookies
      COOKIE_NAMES.forEach(name => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=lax`;
      });

      // Force a hard refresh to the login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, try to redirect to login
      window.location.href = '/login';
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          AI Gmail Manager
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
            Profile
          </Link>
          <Link href="/billing" className="text-sm text-gray-600 hover:text-gray-900">
            Billing
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
} 