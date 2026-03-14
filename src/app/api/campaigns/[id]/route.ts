import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, createRateLimitMiddleware } from '@/utils/rateLimit';

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 100,
});

const campaigns = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const campaign = campaigns.get(id);

  if (!campaign) {
    return NextResponse.json(
      { error: 'Campaign not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ campaign });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const campaign = campaigns.get(id);

  if (!campaign) {
    return NextResponse.json(
      { error: 'Campaign not found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { action, ...updates } = body;

    switch (action) {
      case 'start':
        if (campaign.status === 'pending' || campaign.status === 'paused') {
          campaign.status = 'running';
        }
        break;
      case 'pause':
        if (campaign.status === 'running') {
          campaign.status = 'paused';
        }
        break;
      case 'stop':
        campaign.status = 'stopped';
        break;
      default:
        Object.assign(campaign, updates);
    }

    campaign.updatedAt = new Date().toISOString();
    campaigns.set(id, campaign);

    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  if (!campaigns.has(id)) {
    return NextResponse.json(
      { error: 'Campaign not found' },
      { status: 404 }
    );
  }

  campaigns.delete(id);

  return NextResponse.json({ success: true });
}
