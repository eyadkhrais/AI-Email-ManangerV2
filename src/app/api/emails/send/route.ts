import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createGmailClient } from '@/lib/gmail/gmailClient';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const requestBody = await request.json();
    const { draftId } = requestBody;
    
    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
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
    
    // Get the draft from the database
    const { data: draft, error: draftError } = await supabase
      .from('drafts')
      .select(`
        *,
        emails (
          id,
          from_email,
          from_name,
          subject,
          thread_id
        )
      `)
      .eq('id', draftId)
      .eq('user_id', user.id)
      .single();
    
    if (draftError || !draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }
    
    // Check if the draft is already sent
    if (draft.is_sent) {
      return NextResponse.json(
        { error: 'Draft has already been sent' },
        { status: 400 }
      );
    }
    
    // Get the user's Gmail tokens
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
    
    // Create a Gmail client
    const gmail = createGmailClient(tokensData.access_token, tokensData.refresh_token);
    
    // Prepare the email
    const email = draft.emails;
    const to = email.from_email;
    const subject = draft.subject;
    const messageBody = draft.body_text;
    
    // Create the email message
    const message = [
      `To: ${email.from_name ? `${email.from_name} <${to}>` : to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      messageBody,
    ].join('\r\n');
    
    // Encode the message in base64
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // Send the email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: email.thread_id,
      },
    });
    
    if (!response.data.id) {
      throw new Error('Failed to send email');
    }
    
    // Update the draft in the database
    const { error: updateError } = await supabase
      .from('drafts')
      .update({
        is_sent: true,
        is_approved: true,
        sent_at: new Date().toISOString(),
      })
      .eq('id', draftId);
    
    if (updateError) {
      throw updateError;
    }
    
    return NextResponse.json({ success: true, messageId: response.data.id });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
} 