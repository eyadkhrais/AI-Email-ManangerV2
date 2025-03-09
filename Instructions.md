# Step-by-Step Developer Guide for AI Gmail Manager SaaS

This guide provides step-by-step instructions for building the AI Gmail Manager SaaS. Each step should be completed and tested before moving to the next. The app will connect to a user's Gmail account, learn their writing style, generate draft responses for actionable emails, and include user profile and billing management via Stripe.

---

## Prerequisites

- **Development Environment:** Node.js, npm (or yarn), and a preferred code editor.
- **Accounts & Services:**  
  - Supabase account and project (with API keys ready)
  - Gmail API credentials for OAuth integration
  - OpenAI (or equivalent) API credentials for AI draft generation
  - Stripe account with API keys for subscription billing
  - Vercel account for deployment
- **Basic Knowledge:** Familiarity with Next.js, React, OAuth, and REST APIs.

---

## Step 1: Project Setup

1. **Initialize a New Next.js Project:**
   - Run:
     ```bash
     npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
     ```
2. **Initialize Version Control:**
   - Set up Git:
     ```bash
     git init
     git add .
     git commit -m "Initial commit: Next.js project setup"
     ```
3. **Install Essential Dependencies:**
   - Supabase Client:
     ```bash
     npm install @supabase/supabase-js @supabase/ssr @supabase/auth-ui-react @supabase/auth-ui-shared
     ```
   - Google APIs, OpenAI, and Stripe:
     ```bash
     npm install googleapis openai stripe
     ```
4. **Configure Environment Variables:**
   - Create a `.env.local` file with the following variables:
     ```
     # Supabase
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     
     # Google OAuth
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
     
     # OpenAI
     OPENAI_API_KEY=your-openai-api-key
     
     # Stripe
     STRIPE_SECRET_KEY=your-stripe-secret-key
     STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
     
     # App URL
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     ```
5. **Vercel Deployment Configuration:**
   - Create a `vercel.json` file in the root directory:
     ```json
     {
       "buildCommand": "npm run build",
       "devCommand": "npm run dev",
       "installCommand": "npm install",
       "framework": "nextjs",
       "outputDirectory": ".next"
     }
     ```
   - Add the same environment variables to your Vercel project settings.
6. **Local Testing:**
   - Start the development server:
     ```bash
     npm run dev
     ```
   - Verify that the default Next.js page loads in your browser.

---

## Step 2: Integrate Supabase Authentication

1. **Set Up Supabase:**
   - Create a new project on Supabase.
   - Note your project URL and anon key.
2. **Configure Supabase Client:**
   - Create a file at `lib/supabaseClient.js`:
     ```javascript
     import { createClient } from '@supabase/supabase-js';

     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
     const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

     export const supabase = createClient(supabaseUrl, supabaseAnonKey);
     ```
3. **Develop Authentication Pages:**
   - Create pages/components for user signup and login using Supabase Auth.
   - Add proper error handling and form validation.
4. **Test Authentication Flow:**
   - Run the app, create a test user, and verify that sessions are managed correctly.

---

## Step 3: Build a Responsive UI Layout

1. **Set Up Responsive Styling:**
   - Configure Tailwind CSS (or your chosen CSS framework) according to its setup guide.
2. **Create a Base Layout Component:**
   - Build a layout that includes a header, navigation bar, and footer.
   - Ensure it is responsive for mobile and desktop views.
3. **Implement a Basic Homepage/Dashboard:**
   - Create placeholder pages (e.g., Home, Dashboard) to verify layout responsiveness.
4. **Testing:**
   - Use browser developer tools to simulate different screen sizes and adjust the layout as needed.

---

## Step 4: Gmail OAuth Integration

1. **Create Gmail Connection UI:**
   - Add a "Connect Gmail" button on the dashboard.
   - Design a dedicated page or modal to initiate the Gmail connection.
2. **Implement OAuth Initiation API:**
   - Create an API route (e.g., `/api/gmail/oauth`) to start the OAuth process.
   - Redirect the user to Gmail's OAuth consent screen with the required scopes.
3. **Handle the OAuth Callback:**
   - Set up another API route (e.g., `/api/gmail/callback`) to process the callback.
   - Exchange the authorization code for access and refresh tokens.
   - Securely store these tokens in your Supabase database.
4. **Testing:**
   - Connect a test Gmail account and verify that tokens are stored correctly.

---

## Step 5: Email Ingestion and Filtering

1. **Create an Email Fetching Endpoint:**
   - Develop an API route (e.g., `/api/emails/fetch`) that uses Gmail API and the stored OAuth tokens to fetch emails.
2. **Implement Filtering Logic:**
   - Use Gmail's labels (like spam and promotions) or custom logic to exclude unwanted emails.
   - Mark emails that require a response for further processing.
3. **Testing:**
   - Manually test the endpoint using tools like Postman.
   - Verify that only actionable emails are returned.

---

## Step 6: RAG-Based AI Draft Generation

1. **Set Up AI Service Integration:**
   - Configure access to OpenAI's GPT-4 (or similar) for generating email drafts.
2. **Historical Data Storage & Embedding:**
   - Create a table in Supabase to store user email history and embeddings.
   - Enable and configure the `pgvector` extension for similarity search.
3. **Implement the RAG Workflow:**
   - **Retrieval:**  
     - Compute embeddings for incoming emails.
     - Query the vector store to retrieve similar historical emails.
   - **Draft Generation:**  
     - Combine retrieved context with the new email's content.
     - Send the combined prompt to the AI model to generate a draft reply.
   - Create an API route (e.g., `/api/ai/generate`) to handle this process.
4. **Testing:**
   - Use sample data to simulate an incoming email.
   - Verify that the AI generates a draft that mimics the user's writing style and that the draft is stored appropriately.

---

## Step 7: Dashboard for Email and Draft Management

1. **Design the Dashboard Page:**
   - Build a new Next.js page (e.g., `/dashboard`) to display incoming emails and AI-generated drafts.
2. **Implement Interactive Components:**
   - Create components for viewing, editing, and approving draft responses.
   - Integrate state management (e.g., React Context or hooks) for handling UI interactions.
3. **Connect to Backend APIs:**
   - Fetch actionable emails and drafts using your API endpoints.
   - Ensure that the dashboard updates dynamically.
4. **Testing:**
   - Simulate user actions: view an email, edit a draft, and approve/discard the draft.
   - Validate that changes are saved in the database.

---

## Step 8: Profile and Billing Integration

1. **User Profile Page:**
   - Create a profile page where users can update personal information.
   - Connect this page to Supabase to save profile updates.
2. **Stripe Billing Integration:**
   - Set up Stripe in your backend.
   - Create a billing page for users to view and update subscription details.
   - Implement API routes to handle subscription creation, updates, and webhook events for billing status.
3. **Testing:**
   - Verify that profile updates persist.
   - Use Stripe's test mode to simulate subscription and billing workflows.
   - Confirm that billing events are processed correctly.

---

## Step 9: Final Testing and Deployment

1. **Write Automated Tests:**
   - Develop unit and integration tests for authentication, Gmail OAuth, email fetching, AI draft generation, and billing.
   - Use testing libraries like Jest and React Testing Library.
2. **Staging Environment Setup:**
   - Deploy the application to a staging environment (e.g., Vercel) to perform end-to-end testing.
3. **Production Deployment:**
   - Configure environment variables (Supabase, Gmail API, OpenAI, Stripe) correctly.
   - Deploy the Next.js app to production.
4. **Monitoring and Logging:**
   - Implement logging and error monitoring to track production issues.
   - Iterate on feedback and fix any issues that arise.

---

## Additional Notes

- **Documentation:** Maintain clear code comments and update this guide as the project evolves.
- **Error Handling:** Ensure each API endpoint and UI component gracefully handles errors.
- **Security:** Secure API endpoints, encrypt sensitive data (like OAuth tokens), and follow best practices for handling user data.

---

By following these step-by-step instructions, you can incrementally build, test, and deploy the AI Gmail Manager SaaS, ensuring that each component is functional and properly integrated before moving on to the next.
