import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCheckoutSession, createCustomer } from '@/lib/stripe/client';
import { cookies } from 'next/headers';

// Premium plan price ID
const PREMIUM_PRICE_ID = 'price_1OqXXXXXXXXXXXXXXXXXXXXX'; // Replace with your actual price ID

export async function POST(request: NextRequest) {
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
    
    // Return the checkout URL
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 