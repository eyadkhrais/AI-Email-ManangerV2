'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UsageLimitsProps {
  userId: string;
  isPremium: boolean;
}

// Free tier limits
const FREE_TIER_LIMITS = {
  emailsPerDay: 10,
  draftsPerDay: 5,
};

export default function UsageLimits({ userId, isPremium }: UsageLimitsProps) {
  const [emailsUsed, setEmailsUsed] = useState(0);
  const [draftsUsed, setDraftsUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      setLoading(true);
      
      try {
        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Fetch emails fetched today
        const { count: emailCount, error: emailError } = await supabase
          .from('emails')
          .select('id', { count: 'exact', head: false })
          .eq('user_id', userId)
          .gte('created_at', today.toISOString());
        
        if (emailError) {
          throw emailError;
        }
        
        // Fetch drafts generated today
        const { count: draftCount, error: draftError } = await supabase
          .from('drafts')
          .select('id', { count: 'exact', head: false })
          .eq('user_id', userId)
          .gte('created_at', today.toISOString());
        
        if (draftError) {
          throw draftError;
        }
        
        setEmailsUsed(emailCount || 0);
        setDraftsUsed(draftCount || 0);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsage();
  }, [userId]);

  // If premium, don't show usage limits
  if (isPremium) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Free Tier Usage</h2>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Emails Fetched Today</span>
              <span className="text-sm font-medium text-gray-700">{emailsUsed} / {FREE_TIER_LIMITS.emailsPerDay}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${emailsUsed >= FREE_TIER_LIMITS.emailsPerDay ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min(100, (emailsUsed / FREE_TIER_LIMITS.emailsPerDay) * 100)}%` }}
              ></div>
            </div>
            {emailsUsed >= FREE_TIER_LIMITS.emailsPerDay && (
              <p className="mt-1 text-xs text-red-500">
                You've reached your daily limit for email fetching. Upgrade to Premium for unlimited access.
              </p>
            )}
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">AI Drafts Generated Today</span>
              <span className="text-sm font-medium text-gray-700">{draftsUsed} / {FREE_TIER_LIMITS.draftsPerDay}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${draftsUsed >= FREE_TIER_LIMITS.draftsPerDay ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min(100, (draftsUsed / FREE_TIER_LIMITS.draftsPerDay) * 100)}%` }}
              ></div>
            </div>
            {draftsUsed >= FREE_TIER_LIMITS.draftsPerDay && (
              <p className="mt-1 text-xs text-red-500">
                You've reached your daily limit for AI draft generation. Upgrade to Premium for unlimited access.
              </p>
            )}
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Upgrade to Premium for unlimited email fetching, AI draft generation, and priority support.
            </p>
            <a 
              href="/billing" 
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upgrade to Premium
            </a>
          </div>
        </div>
      )}
    </div>
  );
} 