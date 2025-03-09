import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDraftReply } from '@/lib/openai/client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { emailId } = body;
    
    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Get the email from the database
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', user.id)
      .single();
    
    if (emailError || !email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }
    
    // Get historical emails for context
    const { data: historicalEmails, error: historicalError } = await supabase
      .from('emails')
      .select(`
        id,
        subject,
        body_text,
        drafts (
          body_text
        )
      `)
      .eq('user_id', user.id)
      .eq('requires_response', true)
      .neq('id', emailId)
      .order('received_at', { ascending: false })
      .limit(5);
    
    if (historicalError) {
      console.error('Error fetching historical emails:', historicalError);
    }
    
    // Prepare historical emails for RAG
    const processedHistoricalEmails = (historicalEmails || [])
      .filter(histEmail => histEmail.drafts && histEmail.drafts.length > 0)
      .map(histEmail => ({
        subject: histEmail.subject,
        body_text: histEmail.body_text,
        response_text: histEmail.drafts[0].body_text,
      }));
    
    // Generate a draft reply
    const draftContent = await generateDraftReply(
      email.body_text || '',
      email.subject || '',
      email.from_name || email.from_email || 'Sender',
      processedHistoricalEmails
    );
    
    if (!draftContent) {
      throw new Error('Failed to generate draft content');
    }
    
    // Save the draft to the database
    const { data: draft, error: draftError } = await supabase
      .from('drafts')
      .insert({
        user_id: user.id,
        email_id: email.id,
        subject: `Re: ${email.subject || ''}`,
        body_text: draftContent,
        body_html: `<p>${draftContent.replace(/\n/g, '<br>')}</p>`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (draftError) {
      throw draftError;
    }
    
    return NextResponse.json({ draft });
  } catch (error: any) {
    console.error('Error generating draft reply:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate draft reply' },
      { status: 500 }
    );
  }
} 