import Stripe from 'stripe';

// Check if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production' && !process.env.STRIPE_SECRET_KEY;

// Create a Stripe client only if we have an API key
export const stripe = !isBuildTime 
  ? new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy-key-for-build', {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
    })
  : null;

// Create a checkout session
export const createCheckoutSession = async (customerId: string, priceId: string, successUrl: string, cancelUrl: string) => {
  // Skip API calls during build time
  if (isBuildTime || !stripe) {
    console.log('Skipping Stripe API call during build');
    return { url: 'https://example.com/checkout-session-placeholder' };
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  
  return session;
};

// Create a customer portal session
export const createCustomerPortalSession = async (customerId: string, returnUrl: string) => {
  // Skip API calls during build time
  if (isBuildTime || !stripe) {
    console.log('Skipping Stripe API call during build');
    return { url: 'https://example.com/customer-portal-placeholder' };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  
  return session;
};

// Create a customer
export const createCustomer = async (email: string, name?: string) => {
  // Skip API calls during build time
  if (isBuildTime || !stripe) {
    console.log('Skipping Stripe API call during build');
    return { id: 'cus_placeholder_for_build' };
  }

  const customer = await stripe.customers.create({
    email,
    name,
  });
  
  return customer;
};

// Get a subscription
export const getSubscription = async (subscriptionId: string) => {
  // Skip API calls during build time
  if (isBuildTime || !stripe) {
    console.log('Skipping Stripe API call during build');
    return { id: 'sub_placeholder_for_build', status: 'active' };
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
};

// Cancel a subscription
export const cancelSubscription = async (subscriptionId: string) => {
  // Skip API calls during build time
  if (isBuildTime || !stripe) {
    console.log('Skipping Stripe API call during build');
    return { id: 'sub_placeholder_for_build', status: 'canceled' };
  }

  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}; 