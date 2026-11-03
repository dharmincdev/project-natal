import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PLANS, isStripeConfigured } from '@/lib/stripe/client';
import { stripeCheckoutSchema } from '@/lib/validations/contracts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const normalizedBody = {
      ...body,
      targetTier: body?.targetTier ?? body?.priceType,
    };
    const parseResult = stripeCheckoutSchema.safeParse(normalizedBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid checkout request payload', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { targetTier, userId, userEmail, successUrl, cancelUrl } = parseResult.data;
    const plan = STRIPE_PLANS[targetTier as 'onetime' | 'pro'];

    // If Stripe credentials are not yet configured in .env.local, return simulated checkout
    if (!isStripeConfigured()) {
      return NextResponse.json({
        simulated: true,
        sessionId: `cs_sim_${targetTier}_${Date.now()}`,
        message: 'Stripe keys not configured. Simulating tier upgrade for testing.',
        tier: targetTier,
        plan,
      });
    }

    const stripe = getStripe()!;
    const origin = req.headers.get('origin') || 'http://localhost:3001';

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

    return NextResponse.json({ url: session.url, sessionId: session.id, tier: targetTier });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
