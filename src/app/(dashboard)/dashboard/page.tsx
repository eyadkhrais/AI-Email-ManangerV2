'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DraftEditor from '@/components/dashboard/DraftEditor';
import UsageLimits from '@/components/dashboard/UsageLimits';

// Free tier limits
const FREE_TIER_LIMITS = {
  emailsPerDay: 10,
  draftsPerDay: 5,
};

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
  drafts?: Draft[];
}

interface Draft {
  id: string;
  email_id: string;
  subject: string;
  body_text: string;
  body_html: string;
  is_approved: boolean;
  is_sent: boolean;
  created_at: string;
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
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [sendingDraft, setSendingDraft] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [emailsProcessed, setEmailsProcessed] = useState(0);
  const [draftsGenerated, setDraftsGenerated] = useState(0);
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

        // Check if user has an active subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        setIsPremium(!!subscription);

        // Fetch usage statistics
        fetchTodayUsage(user.id);
      }
      
      setLoading(false);
    };

    getUser();
  }, []);

  const fetchTodayUsage = async (userId: string) => {
    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Fetch emails processed count
      const { count: emailCount } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());
      
      // Fetch drafts generated count
      const { count: draftCount } = await supabase
        .from('drafts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());
      
      setEmailsProcessed(emailCount || 0);
      setDraftsGenerated(draftCount || 0);
    } catch (error) {
      console.error('Error fetching usage statistics:', error);
    }
  };

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
        // Fetch drafts for each email
        const emailsWithDrafts = await Promise.all(
          data.emails.map(async (email: Email) => {
            const { data: drafts } = await supabase
              .from('drafts')
              .select('*')
              .eq('email_id', email.id)
              .order('created_at', { ascending: false });
            
            return {
              ...email,
              drafts: drafts || [],
            };
          })
        );
        
        setEmails(emailsWithDrafts);
      }

      // Update usage statistics
      if (user) {
        fetchTodayUsage(user.id);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch emails');
    } finally {
      setFetchingEmails(false);
    }
  };

  const handleGenerateDraft = async (email: Email) => {
    setError(null);
    setGeneratingDraft(true);
    setSelectedEmail(email);
    
    try {
      // Check if user has reached the free tier limit
      if (!isPremium && draftsGenerated >= 10) {
        throw new Error('You have reached your daily limit for AI draft generation. Upgrade to Premium for unlimited access.');
      }
      
      // Call the API to generate a draft reply
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId: email.id,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.draft) {
        // Update the emails state with the new draft
        setEmails(prevEmails => 
          prevEmails.map(prevEmail => 
            prevEmail.id === email.id
              ? {
                  ...prevEmail,
                  drafts: [data.draft, ...(prevEmail.drafts || [])],
                }
              : prevEmail
          )
        );
        
        setSuccess('Draft generated successfully');
        
        // Update usage statistics
        if (user) {
          fetchTodayUsage(user.id);
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate draft');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft);
  };

  const handleSaveDraft = (updatedDraft: Draft) => {
    // Update the emails state with the updated draft
    setEmails(prevEmails => 
      prevEmails.map(prevEmail => 
        prevEmail.id === updatedDraft.email_id
          ? {
              ...prevEmail,
              drafts: prevEmail.drafts?.map(draft => 
                draft.id === updatedDraft.id ? updatedDraft : draft
              ),
            }
          : prevEmail
      )
    );
    
    setSuccess('Draft updated successfully');
  };

  const handleSendDraft = async (draftId: string) => {
    setError(null);
    setSendingDraft(draftId);
    
    try {
      // Call the API to send the draft
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draftId,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update the emails state to mark the draft as sent
      setEmails(prevEmails => 
        prevEmails.map(prevEmail => ({
          ...prevEmail,
          drafts: prevEmail.drafts?.map(draft => 
            draft.id === draftId
              ? { ...draft, is_sent: true, is_approved: true }
              : draft
          ),
        }))
      );
      
      setSuccess('Email sent successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to send email');
    } finally {
      setSendingDraft(null);
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

        {/* Usage Limits */}
        <UsageLimits 
          isPremium={isPremium}
          emailsProcessed={emailsProcessed}
          draftsGenerated={draftsGenerated}
        />

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
              <div className="space-y-6">
                {emails.map((email) => (
                  <div key={email.id} className="border rounded-lg overflow-hidden">
                    {/* Email Header */}
                    <div className={`p-4 ${email.is_read ? 'bg-white' : 'bg-blue-50'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{email.subject}</h3>
                          <p className="text-sm text-gray-600">
                            From: {email.from_name || email.from_email} &lt;{email.from_email}&gt;
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(email.received_at)}</p>
                        </div>
                        <div>
                          {email.requires_response && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Needs Response
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Email Body */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: email.body_html || `<p>${email.body_text}</p>` }} />
                    </div>
                    
                    {/* Draft Replies */}
                    {email.drafts && email.drafts.length > 0 ? (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <h4 className="text-md font-medium text-gray-900 mb-2">AI-Generated Draft Reply</h4>
                        <div className="bg-white border border-gray-200 rounded-md p-4">
                          <p className="whitespace-pre-wrap">{email.drafts[0].body_text}</p>
                        </div>
                        <div className="mt-4 flex justify-end space-x-2">
                          {!email.drafts[0].is_sent && (
                            <>
                              <button
                                onClick={() => handleEditDraft(email.drafts![0])}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleSendDraft(email.drafts![0].id)}
                                disabled={sendingDraft === email.drafts![0].id}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {sendingDraft === email.drafts![0].id ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                  </>
                                ) : (
                                  'Send'
                                )}
                              </button>
                            </>
                          )}
                          {email.drafts[0].is_sent && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Sent
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">No draft replies yet</p>
                          <button
                            onClick={() => handleGenerateDraft(email)}
                            disabled={generatingDraft && selectedEmail?.id === email.id || (!isPremium && draftsGenerated >= 10)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generatingDraft && selectedEmail?.id === email.id ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </>
                            ) : (
                              'Generate AI Reply'
                            )}
                          </button>
                        </div>
                        {!isPremium && draftsGenerated >= 10 && (
                          <p className="mt-2 text-xs text-red-600">
                            You've reached your daily limit for AI draft generation. Upgrade to Premium for unlimited access.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
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

      {/* Draft Editor Modal */}
      {editingDraft && (
        <DraftEditor
          draft={editingDraft}
          onClose={() => setEditingDraft(null)}
          onSave={handleSaveDraft}
        />
      )}
    </div>
  );
} 