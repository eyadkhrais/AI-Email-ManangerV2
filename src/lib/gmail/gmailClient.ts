import { google } from 'googleapis';

// Create a new OAuth2 client
export const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// Generate the authorization URL
export const getAuthUrl = () => {
  const oauth2Client = createOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.modify',
  ];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force to get refresh token
  });
};

// Exchange authorization code for tokens
export const getTokens = async (code: string) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Create a Gmail client with the user's tokens
export const createGmailClient = (accessToken: string, refreshToken: string) => {
  const oauth2Client = createOAuth2Client();
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Refresh access token if expired
export const refreshAccessToken = async (refreshToken: string) => {
  const oauth2Client = createOAuth2Client();
  
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}; 