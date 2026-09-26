import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe/client';
import { createBrowserClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 400 });
  }

  const stripe = getStripe()!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook secret missing' }, { status: 500 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const targetTier = session.metadata?.targetTier;
      const userId = session.metadata?.userId;

      if (userId && targetTier && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // Update user profile tier in Supabase
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        await supabase
          .from('profiles')
          .update({ tier: targetTier, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook verification failed' }, { status: 400 });
  }
}
