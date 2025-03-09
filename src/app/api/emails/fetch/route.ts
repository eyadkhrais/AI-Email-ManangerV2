import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchEmails } from '@/lib/gmail/emailFetcher';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Create a Supabase client for server-side usage
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            Cookie: cookieStore.toString(),
          },
        },
      }
    );
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if Gmail is connected
    const { data: tokensData, error: tokensError } = await supabase
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (tokensError || !tokensData) {
      return NextResponse.json(
        { error: 'Gmail not connected' },
        { status: 400 }
      );
    }
    
    // Fetch emails from Gmail
    const emails = await fetchEmails(user.id);
    
    // Store the emails in the database
    for (const email of emails) {
      // Check if the email already exists
      const { data: existingEmail } = await supabase
        .from('emails')
        .select('id')
        .eq('user_id', user.id)
        .eq('gmail_id', email.gmail_id)
        .single();
      
      if (!existingEmail) {
        // Insert the email
        await supabase.from('emails').insert(email);
      }
    }
    
    // Fetch all emails from the database
    const { data: dbEmails, error: dbError } = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', user.id)
      .order('received_at', { ascending: false });
    
    if (dbError) {
      throw dbError;
    }
    
    return NextResponse.json({ emails: dbEmails });
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emails' },
      { status: 500 }
    );
  }
} 