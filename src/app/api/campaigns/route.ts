import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, createRateLimitMiddleware } from '@/utils/rateLimit';

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 100,
});

const campaigns = new Map();
let campaignIdCounter = 1;

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  const campaignsList = Array.from(campaigns.values());
  return NextResponse.json({ campaigns: campaignsList });
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { name, tokenMint, strategy, budget, realism } = body;

    if (!name || !tokenMint || !strategy) {
      return NextResponse.json(
        { error: 'Missing required fields: name, tokenMint, strategy' },
        { status: 400 }
      );
    }

    const campaign = {
      id: `campaign-${campaignIdCounter++}`,
      name,
      tokenMint,
      strategy,
      status: 'pending',
      budget: {
        total: budget?.total || 10,
        daily: budget?.daily || 5,
        perHour: budget?.perHour || 1,
        spent: 0,
        slippageMin: budget?.slippageMin || 3,
        slippageMax: budget?.slippageMax || 12,
        priorityFeeMin: budget?.priorityFeeMin || 0.001,
        priorityFeeMax: budget?.priorityFeeMax || 0.005,
      },
      realism: {
        walletCount: realism?.walletCount || 100,
        delayMin: realism?.delayMin || 1,
        delayMax: realism?.delayMax || 60,
        buyRatio: realism?.buyRatio || 0.6,
        sellRatio: realism?.sellRatio || 0.4,
        amountMin: realism?.amountMin || 0.01,
        amountMax: realism?.amountMax || 0.1,
        useNoopInstructions: realism?.useNoopInstructions ?? true,
        microFailChance: realism?.microFailChance || 0.05,
      },
      stats: {
        totalVolume: 0,
        transactionCount: 0,
        makerCount: 0,
        buyCount: 0,
        sellCount: 0,
        averagePrice: 0,
        priceImpact: 0,
      },
      wallets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    campaigns.set(campaign.id, campaign);

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
