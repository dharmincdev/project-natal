import { NextRequest, NextResponse } from 'next/server';
import { answerFamilyTreeQuestion, ChatMessage } from '@/lib/ai/chat';
import { TreeData, UserTier } from '@/types/tree';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      treeData,
      history = [],
      tier,
    }: {
      question?: string;
      treeData?: TreeData;
      history?: ChatMessage[];
      tier?: UserTier;
    } = body || {};

    if (tier && tier !== 'pro') {
      return NextResponse.json(
        {
          error: 'The AI Family Historian is an exclusive Pro feature. Upgrade to Pro ($7/mo) to unlock.',
          code: 'PRO_TIER_REQUIRED',
        },
        { status: 403 }
      );
    }

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json(
        { error: 'A valid question is required.' },
        { status: 400 }
      );
    }

    if (!treeData || !Array.isArray(treeData.people) || !Array.isArray(treeData.relationships)) {
      return NextResponse.json(
        { error: 'Valid family tree data (people and relationships) is required.' },
        { status: 400 }
      );
    }

    const answer = await answerFamilyTreeQuestion(question, treeData, history);

    return NextResponse.json({
      answer,
      grounded: true,
      model: process.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'kinship-heuristic-engine',
    });
  } catch (err) {
    console.error('AI Historian route error:', err);
    const message = err instanceof Error ? err.message : 'Failed to answer family tree question';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

