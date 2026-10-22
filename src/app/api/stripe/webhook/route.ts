import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe/client';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

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
      const session = event.data.object as import('stripe').default.Checkout.Session;
      const targetTier = session.metadata?.targetTier;
      const userId = session.metadata?.userId;

      if (userId && targetTier) {
        // Update user profile tier in Supabase using privileged admin client
        const adminClient = getSupabaseAdminClient();
        if (adminClient) {
          await adminClient
            .from('profiles')
            .update({ tier: targetTier, updated_at: new Date().toISOString() })
            .eq('id', userId);
        } else {
          console.warn(
            '[Stripe Webhook] SUPABASE_SERVICE_ROLE_KEY not configured. Simulated tier upgrade acknowledged.'
          );
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as import('stripe').default.Subscription;
      const userId = subscription.metadata?.userId;

      // Downgrade user profile to 'free' tier per SPEC.md §7
      const adminClient = getSupabaseAdminClient();
      if (adminClient) {
        if (userId) {
          await adminClient
            .from('profiles')
            .update({ tier: 'free', updated_at: new Date().toISOString() })
            .eq('id', userId);
        } else if (subscription.id) {
          await adminClient
            .from('profiles')
            .update({ tier: 'free', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subscription.id);
        }
      } else {
        console.warn(
          '[Stripe Webhook] SUPABASE_SERVICE_ROLE_KEY not configured. Simulated subscription downgrade acknowledged.'
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    const message = err instanceof Error ? err.message : 'Webhook verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
