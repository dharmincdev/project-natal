import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function isStripeConfigured(): boolean {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  return Boolean(
    secretKey &&
    !secretKey.includes('your-stripe-secret-key') &&
    secretKey.startsWith('sk_')
  );
}

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) {
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });
  }

  return stripeInstance;
}

export const STRIPE_PLANS = {
  onetime: {
    name: 'Project Natal One-Time Reunion Pass',
    description: 'Lifetime access up to 100 family members with high-res QR & printable invitations',
    priceInCents: 500, // $5.00
    mode: 'payment' as const,
  },
  pro: {
    name: 'Project Natal Pro Historian Membership',
    description: 'Unlimited family members, full AI Historian, priority tree tracing, and multiple trees',
    priceInCents: 700, // $7.00/mo
    mode: 'subscription' as const,
  },
} as const;
