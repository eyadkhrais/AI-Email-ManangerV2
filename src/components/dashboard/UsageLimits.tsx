'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UsageLimitsProps {
  isPremium: boolean;
  emailsProcessed: number;
  draftsGenerated: number;
}

export default function UsageLimits({ isPremium, emailsProcessed, draftsGenerated }: UsageLimitsProps) {
  // Define limits based on subscription tier
  const maxEmails = isPremium ? Infinity : 50;
  const maxDrafts = isPremium ? Infinity : 10;
  
  // Calculate percentages for progress bars
  const emailPercentage = maxEmails === Infinity ? 0 : Math.min(100, (emailsProcessed / maxEmails) * 100);
  const draftPercentage = maxDrafts === Infinity ? 0 : Math.min(100, (draftsGenerated / maxDrafts) * 100);
  
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Usage Limits</h2>
        <div>
          {isPremium ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Premium
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Free Tier
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Emails Processed</span>
            <span className="text-sm text-gray-500">
              {emailsProcessed} / {maxEmails === Infinity ? '∞' : maxEmails}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${isPremium ? 'bg-green-600' : emailPercentage > 90 ? 'bg-red-600' : 'bg-blue-600'}`} 
              style={{ width: `${isPremium ? 15 : emailPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">AI Drafts Generated</span>
            <span className="text-sm text-gray-500">
              {draftsGenerated} / {maxDrafts === Infinity ? '∞' : maxDrafts}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${isPremium ? 'bg-green-600' : draftPercentage > 90 ? 'bg-red-600' : 'bg-blue-600'}`} 
              style={{ width: `${isPremium ? 15 : draftPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {!isPremium && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-4">
            You're currently on the free tier. Upgrade to Premium for unlimited email processing and AI draft generation.
          </p>
          <Link 
            href="/billing" 
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Upgrade to Premium
          </Link>
        </div>
      )}
    </div>
  );
} 