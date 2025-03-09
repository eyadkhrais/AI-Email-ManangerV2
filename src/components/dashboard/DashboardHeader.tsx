'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function DashboardHeader() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
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