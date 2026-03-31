import Stripe from 'stripe';

// if (!process.env.STRIPE_SECRET_KEY) {
//   throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your .env.local file.');
// }

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-12-18.acacia' as any, // Standard stable version
  typescript: true,
});
