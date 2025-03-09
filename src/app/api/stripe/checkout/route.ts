import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createCheckoutSession, createCustomer } from '@/lib/stripe/client';
import { createCookieOptions } from '@/lib/supabase/cookies';

// Premium plan price ID
const PREMIUM_PRICE_ID = 'price_1OqXXXXXXXXXXXXXXXXXXXXX'; // Replace with your actual price ID

export async function POST(request: NextRequest) {
  try {
    const { cookies, response } = createCookieOptions();

    // Create a Supabase client for server-side usage
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user already has a subscription
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }
    
    // Check if the user already has a Stripe customer ID
    let stripeCustomerId = '';
    
    if (existingSubscription && existingSubscription.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id;
    } else {
      // Create a new Stripe customer
      const customer = await createCustomer(user.email!, user.user_metadata?.full_name);
      stripeCustomerId = customer.id;
      
      // Store the Stripe customer ID in the database
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          status: 'incomplete',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }
    
    // Create a checkout session
    const session = await createCheckoutSession(
      stripeCustomerId,
      PREMIUM_PRICE_ID,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`
    );
    
    // Return the checkout URL with any Set-Cookie headers
    const jsonResponse = NextResponse.json({ url: session.url });
    response.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie);
    });
    return jsonResponse;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 