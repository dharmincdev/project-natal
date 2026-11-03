import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as webhookPOST } from '@/app/api/stripe/webhook/route';
import { POST as checkoutPOST } from '@/app/api/stripe/checkout/route';
import { POST as aiChatPOST } from '@/app/api/ai/chat/route';
import { answerFamilyTreeQuestionLocal } from '@/lib/ai/chat';
import { getInitialSmithTreeData } from '@/data/fixtures/smith-family';
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
const mockSessionsCreate = vi.fn();
const mockStripe = {
  webhooks: {
    constructEvent: mockConstructEvent,
  },
  checkout: {
    sessions: {
      create: mockSessionsCreate,
    },
  },
};

let stripeConfiguredFlag = true;

vi.mock('@/lib/stripe/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/stripe/client')>();
  return {
    ...actual,
    isStripeConfigured: vi.fn(() => stripeConfiguredFlag),
    getStripe: vi.fn(() => (stripeConfiguredFlag ? mockStripe : null)),
  };
});

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn(() => mockAdminClient),
}));

describe('Stripe Checkout & Webhook Routes (SPEC.md §7 — PRO-24, PRO-26)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stripeConfiguredFlag = true;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('creates a $5 One-Time Stripe Hosted Checkout session when Stripe is configured', async () => {
    mockSessionsCreate.mockResolvedValueOnce({
      id: 'cs_test_onetime_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_onetime_123',
    });

    const req = new NextRequest('http://localhost:3001/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        priceType: 'onetime',
        userId: 'user-123',
        userEmail: 'tester@natalfamily.com',
      }),
    });

    const res = await checkoutPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe('https://checkout.stripe.com/c/pay/cs_test_onetime_123');
    expect(body.sessionId).toBe('cs_test_onetime_123');
    expect(body.tier).toBe('onetime');
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        metadata: { userId: 'user-123', targetTier: 'onetime' },
      })
    );
  });

  it('returns simulated checkout confirmation payload when Stripe keys are not configured', async () => {
    stripeConfiguredFlag = false;

    const req = new NextRequest('http://localhost:3001/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        targetTier: 'pro',
        userId: 'user-123',
      }),
    });

    const res = await checkoutPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.simulated).toBe(true);
    expect(body.tier).toBe('pro');
    expect(body.sessionId).toMatch(/^cs_sim_pro_/);
    expect(body.plan.priceInCents).toBe(700);
  });

  it('successfully upgrades tier to pro on checkout.session.completed', async () => {
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

    const res = await webhookPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);

    expect(mockAdminClient.from).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'pro' })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('successfully upgrades tier to onetime on checkout.session.completed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: {
            userId: 'user-789',
            targetTier: 'onetime',
          },
        },
      },
    });

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'stripe-signature': 'sig_test' },
    });

    const res = await webhookPOST(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'onetime' })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'user-789');
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

    const res = await webhookPOST(req);
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

    const res = await webhookPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid signature');
  });
});

describe('AI Family Historian Reasoning Engine & Pro Tier Gating (PRO-25, PRO-26)', () => {
  const smithTree = getInitialSmithTreeData();

  it('answers multi-generation LCA kinship questions accurately (Emily to Robert)', () => {
    const ans = answerFamilyTreeQuestionLocal('How is Emily related to Robert?', smithTree);
    expect(ans.toLowerCase()).toContain('granddaughter');
    expect(ans).toContain('James Smith and Linda Smith');
    expect(ans.toLowerCase()).toContain('grandfather');
  });

  it('answers cousin and aunt/uncle LCA kinship questions with shared ancestors', () => {
    const cousinAns = answerFamilyTreeQuestionLocal('How is Emily related to Olivia?', smithTree);
    expect(cousinAns.toLowerCase()).toContain('first cousin');
    expect(cousinAns).toContain('Robert Smith');

    const auntAns = answerFamilyTreeQuestionLocal('How is Sarah related to Emily?', smithTree);
    expect(auntAns.toLowerCase()).toContain('aunt');
    expect(auntAns.toLowerCase()).toContain('niece');
  });

  it('answers multi-month birthday queries (March or April)', () => {
    const ans = answerFamilyTreeQuestionLocal('Who was born in March or April?', smithTree);
    expect(ans).toContain('James Smith');
    expect(ans).toContain('Emily Smith');
  });

  it('answers oldest relative, career milestones, and oral history audio queries', () => {
    const oldestAns = answerFamilyTreeQuestionLocal('Who is the oldest person in this tree?', smithTree);
    expect(oldestAns).toContain('Robert Smith');
    expect(oldestAns).toContain('1945-05-12');

    const careerAns = answerFamilyTreeQuestionLocal("Tell me about Robert's career", smithTree);
    expect(careerAns).toContain('Civil Engineer');
    expect(careerAns).toContain('Retired from civil engineering');

    const audioAns = answerFamilyTreeQuestionLocal('What oral history audio stories are in the vault?', smithTree);
    expect(audioAns).toContain("Grandpa Robert's Memories of Chicago (1968)");
  });

  it('enforces Pro tier gating on POST /api/ai/chat for Free and One-Time tiers', async () => {
    const blockedReq = new NextRequest('http://localhost:3001/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        question: 'How is Emily related to Robert?',
        treeData: smithTree,
        tier: 'onetime',
      }),
    });

    const blockedRes = await aiChatPOST(blockedReq);
    expect(blockedRes.status).toBe(403);
    const blockedBody = await blockedRes.json();
    expect(blockedBody.code).toBe('PRO_TIER_REQUIRED');

    const proReq = new NextRequest('http://localhost:3001/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        question: 'How is Emily related to Robert?',
        treeData: smithTree,
        tier: 'pro',
      }),
    });

    const proRes = await aiChatPOST(proReq);
    expect(proRes.status).toBe(200);
    const proBody = await proRes.json();
    expect(proBody.grounded).toBe(true);
    expect(proBody.answer.toLowerCase()).toContain('granddaughter');
  });
});
