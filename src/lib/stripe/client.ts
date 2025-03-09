import Stripe from 'stripe';

// Create a Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

// Create a checkout session
export const createCheckoutSession = async (customerId: string, priceId: string, successUrl: string, cancelUrl: string) => {
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
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  
  return session;
};

// Create a customer
export const createCustomer = async (email: string, name?: string) => {
  const customer = await stripe.customers.create({
    email,
    name,
  });
  
  return customer;
};

// Get a subscription
export const getSubscription = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
};

// Cancel a subscription
export const cancelSubscription = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}; 