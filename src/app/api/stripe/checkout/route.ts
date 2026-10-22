import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PLANS, isStripeConfigured } from '@/lib/stripe/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetTier, userId, userEmail, successUrl, cancelUrl } = body;

    if (targetTier !== 'onetime' && targetTier !== 'pro') {
      return NextResponse.json({ error: 'Invalid target tier selected' }, { status: 400 });
    }

    // If Stripe credentials are not yet configured in .env.local, return simulated checkout
    if (!isStripeConfigured()) {
      return NextResponse.json({
        simulated: true,
        message: 'Stripe keys not configured. Simulating tier upgrade for testing.',
        tier: targetTier,
      });
    }

    const stripe = getStripe()!;
    const plan = STRIPE_PLANS[targetTier as 'onetime' | 'pro'];
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const sessionParams: import('stripe').default.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.priceInCents,
            ...(plan.mode === 'subscription' ? { recurring: { interval: 'month' } } : {}),
          },
          quantity: 1,
        },
      ],
      mode: plan.mode,
      success_url: successUrl || `${origin}/dashboard?upgrade_success=true&tier=${targetTier}`,
      cancel_url: cancelUrl || `${origin}/dashboard?upgrade_canceled=true`,
      metadata: {
        userId: userId || 'anonymous',
        targetTier,
      },
    };

    if (userEmail) {
      sessionParams.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
