import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, createRateLimitMiddleware } from '@/utils/rateLimit';

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 30,
});

let settings = {
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  jitoUuid: '',
  nozomiApiKey: '',
  astralaneApiKey: '',
  defaultMevProvider: 'jito' as const,
  telegramWebhook: '',
  emailAlerts: '',
};

const presets = [
  {
    id: 'aggressive',
    name: 'Aggressive Mode',
    description: '500 wallets, 60/40 buy ratio, burst mode',
    settings: {
      walletCount: 500,
      buyRatio: 0.6,
      strategy: 'burst',
    },
  },
  {
    id: 'stealth',
    name: 'Stealth Mode',
    description: '100 wallets, 70/30 buy ratio, drip mode',
    settings: {
      walletCount: 100,
      buyRatio: 0.7,
      strategy: 'drip',
    },
  },
];

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  return NextResponse.json({
    settings: {
      rpcUrl: settings.rpcUrl,
      defaultMevProvider: settings.defaultMevProvider,
      telegramWebhook: settings.telegramWebhook ? 'configured' : '',
      emailAlerts: settings.emailAlerts ? 'configured' : '',
    },
    presets,
  });
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { action, ...updates } = body;

    if (action === 'save') {
      settings = { ...settings, ...updates };
      return NextResponse.json({ success: true, settings });
    }

    if (action === 'test-rpc') {
      const testRpcUrl = updates.rpcUrl || settings.rpcUrl;
      
      try {
        const response = await fetch(testRpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getHealth',
          }),
        });
        
        const data = await response.json();
        const isHealthy = data.result === 'ok' || response.ok;
        
        return NextResponse.json({
          success: isHealthy,
          message: isHealthy ? 'RPC is healthy' : 'RPC returned error',
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: 'Failed to connect to RPC',
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: save or test-rpc' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process settings action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    
    if (body.presetId) {
      const preset = presets.find(p => p.id === body.presetId);
      if (!preset) {
        return NextResponse.json(
          { error: 'Preset not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ preset });
    }

    return NextResponse.json(
      { error: 'Missing presetId' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load preset' },
      { status: 500 }
    );
  }
}
