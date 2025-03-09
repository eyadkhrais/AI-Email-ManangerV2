# AI Gmail Manager SaaS

AI Gmail Manager SaaS is an AI-powered web application that connects to a user's Gmail account, learns their writing style from historical emails, and generates draft replies for actionable messages. The app filters out spam and promotional emails, ensuring that users only see emails that require a response. It also provides profile management and subscription billing via Stripe for a monthly subscription service.

## Features

- **Gmail Integration:** Connect your Gmail account via OAuth and filter out spam and promotional emails.
- **AI-Driven Draft Generation:** Leverage GPT-4 with a RAG implementation to analyze historical emails and generate draft responses.
- **User Dashboard:** View, edit, and approve AI-generated drafts with a responsive design for both mobile and desktop use.
- **Profile Management:** Update personal details and email preferences.
- **Billing & Subscription:** Manage monthly subscriptions using Stripe.
- **Secure & Scalable:** Built with Next.js and Supabase for robust authentication and database management.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Next.js API routes / Serverless functions
- **Database & Authentication:** Supabase (Postgres with `pgvector` for vector search)
- **AI Model & RAG:** OpenAI's GPT-4 with retrieval-augmented generation
- **Email Integration:** Gmail API
- **Billing:** Stripe

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase account and project
- Gmail API credentials
- OpenAI API key
- Stripe account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-gmail-manager-saas.git
   cd ai-gmail-manager-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
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

4. Set up Supabase:
   - Create a new project on Supabase
   - Run the SQL migrations in `supabase/migrations/` to set up the database schema

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This project is optimized for deployment on Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add the environment variables to your Vercel project
4. Deploy!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [OpenAI](https://openai.com/)
- [Gmail API](https://developers.google.com/gmail/api)
- [Stripe](https://stripe.com/)
