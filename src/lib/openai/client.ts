import OpenAI from 'openai';

// Check if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production' && !process.env.OPENAI_API_KEY;

// Create an OpenAI client only if we have an API key
export const openai = !isBuildTime 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
    })
  : null;

// Generate embeddings for a text
export const generateEmbedding = async (text: string) => {
  // Skip API calls during build time
  if (isBuildTime || !openai) {
    console.log('Skipping OpenAI API call during build');
    return [];
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
};

// Generate a draft reply using RAG
export const generateDraftReply = async (
  emailContent: string,
  emailSubject: string,
  senderName: string,
  historicalEmails: any[]
) => {
  // Skip API calls during build time
  if (isBuildTime || !openai) {
    console.log('Skipping OpenAI API call during build');
    return "This is a placeholder response for build time.";
  }

  // Prepare the context from historical emails
  let context = '';
  
  if (historicalEmails.length > 0) {
    context = 'Here are some examples of my previous email responses:\n\n';
    
    for (const email of historicalEmails.slice(0, 3)) {
      context += `Subject: ${email.subject}\n`;
      context += `Content: ${email.body_text}\n`;
      context += `My response: ${email.response_text}\n\n`;
    }
  }
  
  // Prepare the prompt
  const prompt = `
You are an AI assistant that helps me write email replies. Please write a draft reply to the following email:

From: ${senderName}
Subject: ${emailSubject}
Email Content: ${emailContent}

${context}

Please write a professional and friendly response that addresses the points in the email. 
Keep the tone consistent with my previous responses if provided.
The response should be concise but thorough, and should maintain a professional tone.
`;

  // Generate the draft reply
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an AI assistant that helps write email replies in the user\'s style. Your responses should be professional, concise, and address all points in the original email.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });
  
  return response.choices[0].message.content;
}; 