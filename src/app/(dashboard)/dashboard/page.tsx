'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface Email {
  id: string;
  gmail_id: string;
  thread_id: string;
  from_email: string;
  from_name: string;
  subject: string;
  body_text: string;
  body_html: string;
  received_at: string;
  is_read: boolean;
  requires_response: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for error or success messages in the URL
    const errorMessage = searchParams.get('error');
    const successMessage = searchParams.get('success');
    
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
    
    if (successMessage) {
      setSuccess(decodeURIComponent(successMessage));
      
      // If Gmail was connected successfully, fetch emails
      if (successMessage.includes('Gmail connected')) {
        fetchUserEmails();
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if Gmail is connected
        const { data, error } = await supabase
          .from('gmail_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data && data.access_token) {
          setGmailConnected(true);
          
          // Fetch emails if Gmail is connected
          fetchUserEmails();
        }
      }
      
      setLoading(false);
    };

    getUser();
  }, []);

  const handleConnectGmail = async () => {
    setError(null);
    setSuccess(null);
    setConnectingGmail(true);
    
    try {
      // Call the API to get the authorization URL
      const response = await fetch('/api/gmail/oauth');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.authUrl) {
        // Redirect to the authorization URL
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to connect Gmail');
      setConnectingGmail(false);
    }
  };

  const fetchUserEmails = async () => {
    if (fetchingEmails) return;
    
    setFetchingEmails(true);
    setError(null);
    
    try {
      // Call the API to fetch emails
      const response = await fetch('/api/emails/fetch');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.emails) {
        setEmails(data.emails);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch emails');
    } finally {
      setFetchingEmails(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Gmail Connection Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Gmail Connection</h2>
          {gmailConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-600">
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Gmail connected</span>
              </div>
              <button
                onClick={fetchUserEmails}
                disabled={fetchingEmails}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fetchingEmails ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  'Refresh Emails'
                )}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Connect your Gmail account to start generating AI-powered draft replies.
              </p>
              <button
                onClick={handleConnectGmail}
                disabled={connectingGmail}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectingGmail ? 'Connecting...' : 'Connect Gmail'}
              </button>
            </div>
          )}
        </div>

        {/* Email Dashboard */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Emails</h2>
          {gmailConnected ? (
            emails.length > 0 ? (
              <div className="overflow-hidden border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emails.map((email) => (
                      <tr key={email.id} className={email.is_read ? '' : 'font-semibold bg-blue-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {email.from_name || email.from_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {email.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(email.received_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {email.requires_response ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Needs Response
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              No Action Needed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : fetchingEmails ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Fetching emails...</span>
              </div>
            ) : (
              <div className="border rounded-md p-4 text-gray-600">
                <p>No emails found. Click the "Refresh Emails" button to fetch your emails.</p>
              </div>
            )
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