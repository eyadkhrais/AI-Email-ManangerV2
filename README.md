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

### Detailed Setup Instructions

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-gmail-manager.git
cd ai-gmail-manager
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Set Up Supabase

1. Create a new project on [Supabase](https://supabase.io/)
2. Go to Project Settings > API to get your project URL and anon key
3. Run the SQL migrations in `supabase/migrations/` to set up the database schema:
   - Copy the SQL from `supabase/migrations/20240101000000_initial_schema.sql`
   - Paste it into the SQL editor in Supabase and run it
4. Enable the `pgvector` extension in Supabase:
   - Go to Database > Extensions
   - Search for `pgvector` and enable it

#### 4. Set Up Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Gmail API:
   - Go to APIs & Services > Library
   - Search for "Gmail API" and enable it
4. Create OAuth credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/gmail/callback` (for development)
     - `https://your-production-domain.com/api/gmail/callback` (for production)
   - Note your client ID and client secret

#### 5. Set Up OpenAI

1. Create an account on [OpenAI](https://platform.openai.com/)
2. Go to API Keys and create a new API key
3. Note your API key

#### 6. Set Up Stripe

1. Create an account on [Stripe](https://stripe.com/)
2. Go to Developers > API keys to get your publishable and secret keys
3. Create a product and price:
   - Go to Products > Add Product
   - Set the product name to "Premium Plan"
   - Set the price to $9.99 per month
   - Note the price ID (starts with "price_")
4. Set up a webhook:
   - Go to Developers > Webhooks
   - Add an endpoint with the URL `https://your-production-domain.com/api/stripe/webhook`
   - Select the following events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Note the webhook signing secret

#### 7. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/callback

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 8. Update Stripe Price ID

Open `src/app/api/stripe/checkout/route.ts` and replace the placeholder price ID with your actual Stripe price ID:

```typescript
// Premium plan price ID
const PREMIUM_PRICE_ID = 'your-actual-price-id'; // Replace with your actual price ID
```

#### 9. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Deployment to Vercel

This project is optimized for deployment on Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add the environment variables to your Vercel project
4. Deploy!

## Project Structure

```
ai-gmail-manager/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   └── billing/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── emails/
│   │   │   ├── gmail/
│   │   │   ├── ai/
│   │   │   └── stripe/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── ui/
│   └── lib/
│       ├── gmail/
│       ├── openai/
│       ├── stripe/
│       └── supabase.ts
├── supabase/
│   └── migrations/
├── public/
├── .env.local
├── next.config.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Troubleshooting

### Node.js Version Issues

If you encounter errors like `Cannot find module '../server/require-hook'`, make sure you're using Node.js v18 or later. This project is not compatible with Node.js v23.6+ due to some dependencies.

You can use nvm to switch to a compatible Node.js version:

```bash
nvm install 18
nvm use 18
```

### Supabase Authentication Issues

If you're having issues with Supabase authentication:

1. Make sure your Supabase URL and anon key are correct
2. Check that you've enabled email/password authentication in your Supabase project
3. For Google OAuth, ensure you've set up the correct redirect URI in both Google Cloud Console and your environment variables

### Gmail API Issues

If you're having issues connecting to Gmail:

1. Verify that you've enabled the Gmail API in Google Cloud Console
2. Check that your OAuth credentials are correct and have the necessary scopes
3. Make sure your redirect URI is correctly set up in both Google Cloud Console and your environment variables

### Stripe Integration Issues

If you're having issues with Stripe:

1. Ensure your Stripe API keys are correct
2. Verify that you've created a product and price in Stripe
3. Check that you've updated the price ID in `src/app/api/stripe/checkout/route.ts`
4. For webhook testing, use the Stripe CLI to forward events to your local development server

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [OpenAI](https://openai.com/)
- [Gmail API](https://developers.google.com/gmail/api)
- [Stripe](https://stripe.com/)
