import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { stripe } from '@/lib/stripe/client';
import { createCookieOptions } from '@/lib/supabase/cookies';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }
    
    // Verify the webhook signature
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        requestBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
    
    const { cookies, response } = createCookieOptions();
    
    // Create a Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Get the subscription
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        // Update the subscription in the database
        await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', session.customer as string);
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Update the subscription in the database
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Update the subscription in the database
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        break;
      }
    }
    
    // Return success response with any Set-Cookie headers
    const jsonResponse = NextResponse.json({ received: true });
    response.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie);
    });
    return jsonResponse;
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to handle webhook' },
      { status: 500 }
    );
  }
} 