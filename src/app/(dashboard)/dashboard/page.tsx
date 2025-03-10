'use client';

import { useState, useEffect, Suspense } from 'react';
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

// Component that uses useSearchParams
function DashboardWithSearchParams() {
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
        const { data: gmailTokens } = await supabase
          .from('gmail_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setGmailConnected(!!gmailTokens);
        
        // Check subscription status
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        setIsPremium(!!subscription);
        
        // If Gmail is connected, fetch emails
        if (gmailTokens) {
          fetchUserEmails();
        }
        
        // Fetch usage metrics
        fetchTodayUsage(user.id);
      }
      
      setLoading(false);
    };

    getUser();
  }, []);

  const fetchTodayUsage = async (userId: string) => {
    try {
      // Get today's date in the format YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Count emails processed today
      const { count: emailsCount, error: emailsError } = await supabase
        .from('emails')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', today);
      
      if (emailsError) throw emailsError;
      
      // Count drafts generated today
      const { count: draftsCount, error: draftsError } = await supabase
        .from('drafts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', today);
      
      if (draftsError) throw draftsError;
      
      setEmailsProcessed(emailsCount || 0);
      setDraftsGenerated(draftsCount || 0);
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
    }
  };

  const handleConnectGmail = async () => {
    setError(null);
    setSuccess(null);
    setConnectingGmail(true);
    
    try {
      // Call the API to get the authorization URL
      const response = await fetch('/api/gmail/oauth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.url) {
        // Redirect to the authorization URL
        window.location.href = data.url;
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
      // Check if we've reached the free tier limit
      if (!isPremium && emailsProcessed >= FREE_TIER_LIMITS.emailsPerDay) {
        throw new Error(`You've reached the limit of ${FREE_TIER_LIMITS.emailsPerDay} emails per day. Please upgrade to the premium plan.`);
      }
      
      // Call the API to fetch emails
      const response = await fetch('/api/emails/fetch', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update the emails state with the fetched emails
      setEmails(data.emails || []);
      
      // Update usage metrics
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
    setSelectedEmail(email);
    setError(null);
    setGeneratingDraft(true);
    
    try {
      // Check if we've reached the free tier limit
      if (!isPremium && draftsGenerated >= FREE_TIER_LIMITS.draftsPerDay) {
        throw new Error(`You've reached the limit of ${FREE_TIER_LIMITS.draftsPerDay} drafts per day. Please upgrade to the premium plan.`);
      }
      
      // Call the API to generate a draft
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId: email.id,
          subject: email.subject,
          body: email.body_text,
          sender: email.from_name || email.from_email,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update the emails state with the new draft
      setEmails(prevEmails => {
        return prevEmails.map(prevEmail => {
          if (prevEmail.id === email.id) {
            return {
              ...prevEmail,
              drafts: [...(prevEmail.drafts || []), data.draft],
            };
          }
          return prevEmail;
        });
      });
      
      // Update usage metrics
      if (user) {
        fetchTodayUsage(user.id);
      }
      
      setSuccess('Draft generated successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to generate draft');
    } finally {
      setGeneratingDraft(false);
      setSelectedEmail(null);
    }
  };

  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft);
  };

  const handleSaveDraft = (updatedDraft: Draft) => {
    // Update the draft in the emails state
    setEmails(prevEmails => {
      return prevEmails.map(email => {
        if (email.drafts && email.drafts.some(draft => draft.id === updatedDraft.id)) {
          return {
            ...email,
            drafts: email.drafts.map(draft => {
              if (draft.id === updatedDraft.id) {
                return updatedDraft;
              }
              return draft;
            }),
          };
        }
        return email;
      });
    });
    
    setEditingDraft(null);
    setSuccess('Draft saved successfully');
  };

  const handleSendDraft = async (draftId: string) => {
    setError(null);
    setSuccess(null);
    setSendingDraft(draftId);
    
    try {
      // Find the draft
      let draftToSend: Draft | null = null;
      let emailId: string | null = null;
      
      for (const email of emails) {
        if (email.drafts) {
          const draft = email.drafts.find(d => d.id === draftId);
          if (draft) {
            draftToSend = draft;
            emailId = email.id;
            break;
          }
        }
      }
      
      if (!draftToSend || !emailId) {
        throw new Error('Draft not found');
      }
      
      // Call the API to send the email
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draftId,
          emailId,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update the emails state to mark the draft as sent
      setEmails(prevEmails => {
        return prevEmails.map(email => {
          if (email.id === emailId && email.drafts) {
            return {
              ...email,
              drafts: email.drafts.map(draft => {
                if (draft.id === draftId) {
                  return {
                    ...draft,
                    is_sent: true,
                  };
                }
                return draft;
              }),
            };
          }
          return email;
        });
      });
      
      setSuccess('Email sent successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to send email');
    } finally {
      setSendingDraft(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    // If the date is today, show only the time
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise, show the date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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

        {/* Gmail Connection */}
        {!gmailConnected ? (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Connect Your Gmail Account</h2>
            <p className="text-gray-600 mb-4">
              To get started, connect your Gmail account to enable AI-powered email responses.
            </p>
            <button
              onClick={handleConnectGmail}
              disabled={connectingGmail}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connectingGmail ? 'Connecting...' : 'Connect Gmail'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white shadow rounded-lg p-4 mb-2">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Your Emails</h2>
                <button
                  onClick={fetchUserEmails}
                  disabled={fetchingEmails}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fetchingEmails ? 'Refreshing...' : 'Refresh Emails'}
                </button>
              </div>
            </div>

            {/* Email List */}
            {emails.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-600">
                  No emails found that require a response. Click "Refresh Emails" to check for new emails.
                </p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                {emails.map((email) => (
                  <div key={email.id} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{email.from_name || email.from_email}</span>
                        <span className="ml-2 text-xs text-gray-500">{formatDate(email.received_at)}</span>
                      </div>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">{email.subject}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{email.body_text}</p>
                    
                    {/* Draft Generation */}
                    {(!email.drafts || email.drafts.length === 0) && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleGenerateDraft(email)}
                          disabled={generatingDraft && selectedEmail?.id === email.id}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingDraft && selectedEmail?.id === email.id ? 'Generating...' : 'Generate Draft Reply'}
                        </button>
                      </div>
                    )}
                    
                    {/* Drafts */}
                    {email.drafts && email.drafts.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">AI-Generated Drafts</h4>
                        <div className="space-y-4">
                          {email.drafts.map((draft) => (
                            <div key={draft.id} className="bg-gray-50 p-4 rounded-md">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">{draft.subject}</h5>
                              <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{draft.body_text}</p>
                              
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditDraft(draft)}
                                  className="inline-flex justify-center py-1 px-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Edit
                                </button>
                                
                                {!draft.is_sent && (
                                  <button
                                    onClick={() => handleSendDraft(draft.id)}
                                    disabled={sendingDraft === draft.id}
                                    className="inline-flex justify-center py-1 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {sendingDraft === draft.id ? 'Sending...' : 'Send'}
                                  </button>
                                )}
                                
                                {draft.is_sent && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Sent
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

// Wrap with Suspense in the main component
export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <DashboardWithSearchParams />
    </Suspense>
  );
} 