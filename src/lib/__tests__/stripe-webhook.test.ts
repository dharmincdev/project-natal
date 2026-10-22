import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/stripe/webhook/route';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockUpdate = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockResolvedValue({ error: null });
mockUpdate.mockReturnValue({ eq: mockEq });

const mockAdminClient = {
  from: vi.fn().mockReturnValue({
    update: mockUpdate,
  }),
};

const mockConstructEvent = vi.fn();
const mockStripe = {
  webhooks: {
    constructEvent: mockConstructEvent,
  },
};

vi.mock('@/lib/stripe/client', () => ({
  isStripeConfigured: vi.fn(() => true),
  getStripe: vi.fn(() => mockStripe),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn(() => mockAdminClient),
}));

describe('Stripe Webhook Route (SPEC.md §7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('successfully upgrades tier on checkout.session.completed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: {
            userId: 'user-123',
            targetTier: 'pro',
          },
        },
      },
    });

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'stripe-signature': 'sig_test' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);

    expect(mockAdminClient.from).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'pro' })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('successfully downgrades tier to free on customer.subscription.deleted', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          metadata: {
            userId: 'user-456',
          },
        },
      },
    });

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'stripe-signature': 'sig_test' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);

    expect(mockAdminClient.from).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'free' })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'user-456');
  });

  it('returns 400 when webhook signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'stripe-signature': 'bad_sig' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid signature');
  });
});
