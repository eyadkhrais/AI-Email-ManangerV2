import { createGmailClient, refreshAccessToken } from './gmailClient';
import { createClient } from '@supabase/supabase-js';

// Decode base64 encoded email content
const decodeBase64 = (data: string) => {
  return Buffer.from(data, 'base64').toString('utf-8');
};

// Extract email body from Gmail message
const extractEmailBody = (payload: any) => {
  let textBody = '';
  let htmlBody = '';

  // Check if the message has parts
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        textBody = decodeBase64(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body.data) {
        htmlBody = decodeBase64(part.body.data);
      } else if (part.parts) {
        // Recursively check nested parts
        const nestedBodies = extractEmailBody(part);
        if (!textBody && nestedBodies.textBody) {
          textBody = nestedBodies.textBody;
        }
        if (!htmlBody && nestedBodies.htmlBody) {
          htmlBody = nestedBodies.htmlBody;
        }
      }
    }
  } else if (payload.body && payload.body.data) {
    // If the message doesn't have parts, check the body directly
    if (payload.mimeType === 'text/plain') {
      textBody = decodeBase64(payload.body.data);
    } else if (payload.mimeType === 'text/html') {
      htmlBody = decodeBase64(payload.body.data);
    }
  }

  return { textBody, htmlBody };
};

// Extract email headers
const extractEmailHeaders = (headers: any[]) => {
  const result: any = {};
  
  for (const header of headers) {
    if (header.name === 'From') {
      result.from = header.value;
      
      // Extract name and email from the From header
      const match = header.value.match(/^(.*?)\s*<(.*)>$/);
      if (match) {
        result.fromName = match[1].trim();
        result.fromEmail = match[2].trim();
      } else {
        result.fromEmail = header.value;
      }
    } else if (header.name === 'To') {
      result.to = header.value;
    } else if (header.name === 'Subject') {
      result.subject = header.value;
    } else if (header.name === 'Date') {
      result.date = new Date(header.value);
    }
  }
  
  return result;
};

// Check if an email requires a response
const requiresResponse = (email: any) => {
  // This is a simple implementation - in a real app, you would use more sophisticated logic
  // For example, checking if the email is from a known contact, if it contains a question, etc.
  
  // For now, we'll assume all non-promotional emails require a response
  return true;
};

// Fetch emails from Gmail
export const fetchEmails = async (userId: string, maxResults = 10) => {
  try {
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get the user's Gmail tokens
    const { data: tokensData, error: tokensError } = await supabase
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (tokensError || !tokensData) {
      throw new Error('Gmail tokens not found');
    }
    
    // Check if the access token is expired and refresh if needed
    const now = Date.now();
    if (tokensData.expiry_date && now >= tokensData.expiry_date) {
      const newCredentials = await refreshAccessToken(tokensData.refresh_token);
      
      // Update the tokens in the database
      await supabase
        .from('gmail_tokens')
        .update({
          access_token: newCredentials.access_token,
          expiry_date: newCredentials.expiry_date,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      
      tokensData.access_token = newCredentials.access_token;
    }
    
    // Create a Gmail client
    const gmail = createGmailClient(tokensData.access_token, tokensData.refresh_token);
    
    // Fetch the list of emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: '-category:promotions -category:social -category:updates -category:forums -category:spam',
    });
    
    if (!response.data.messages || response.data.messages.length === 0) {
      return [];
    }
    
    // Fetch the details of each email
    const emails = [];
    
    for (const message of response.data.messages) {
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
      });
      
      const { payload, threadId, labelIds } = messageResponse.data;
      
      if (!payload || !payload.headers) {
        continue;
      }
      
      // Extract email headers
      const headers = extractEmailHeaders(payload.headers);
      
      // Extract email body
      const { textBody, htmlBody } = extractEmailBody(payload);
      
      // Check if the email requires a response
      const needsResponse = requiresResponse(messageResponse.data);
      
      // Create an email object
      const email = {
        gmail_id: message.id,
        thread_id: threadId,
        from_email: headers.fromEmail,
        from_name: headers.fromName,
        to_email: headers.to,
        subject: headers.subject,
        body_text: textBody,
        body_html: htmlBody,
        received_at: headers.date,
        is_read: !labelIds?.includes('UNREAD'),
        requires_response: needsResponse,
        user_id: userId,
      };
      
      emails.push(email);
    }
    
    return emails;
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}; 