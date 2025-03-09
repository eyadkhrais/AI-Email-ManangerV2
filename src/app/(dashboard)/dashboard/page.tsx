'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      // Check if Gmail is connected (this is a placeholder - we'll implement this later)
      setGmailConnected(false);
    };

    getUser();
  }, []);

  const handleConnectGmail = () => {
    // This will be implemented in Step 4
    alert('Gmail connection will be implemented in Step 4');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gmail Connection Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Gmail Connection</h2>
          {gmailConnected ? (
            <div className="flex items-center text-green-600">
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Gmail connected</span>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Connect your Gmail account to start generating AI-powered draft replies.
              </p>
              <button
                onClick={handleConnectGmail}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Connect Gmail
              </button>
            </div>
          )}
        </div>

        {/* Email Dashboard Placeholder */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Emails</h2>
          {gmailConnected ? (
            <div className="border rounded-md p-4 text-gray-600">
              <p>Your emails will appear here once Gmail is connected and emails are fetched.</p>
            </div>
          ) : (
            <div className="border rounded-md p-4 text-gray-600">
              <p>Connect your Gmail account to see your emails here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 