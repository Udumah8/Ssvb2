import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, createRateLimitMiddleware } from '@/utils/rateLimit';
import { v4 as uuidv4 } from 'uuid';

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 50,
});

const wallets = new Map();

function generateWalletAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = '';
  for (let i = 0; i < 44; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  const walletsList = Array.from(wallets.values());
  const totalBalance = walletsList.reduce((sum: number, w: { balance: number }) => sum + w.balance, 0);
  const activeWallets = walletsList.filter((w: { isActive: boolean }) => w.isActive).length;

  return NextResponse.json({
    wallets: walletsList,
    stats: {
      total: walletsList.length,
      active: activeWallets,
      totalBalance,
    },
  });
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { action, count, walletId, masterWallet } = body;

    switch (action) {
      case 'generate': {
        const walletCount = count || 10;
        const newWallets = [];

        for (let i = 0; i < walletCount; i++) {
          const wallet = {
            id: uuidv4(),
            publicKey: generateWalletAddress(),
            privateKeyEncrypted: 'encrypted_' + uuidv4(),
            balance: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          wallets.set(wallet.id, wallet);
          newWallets.push(wallet);
        }

        return NextResponse.json({ wallets: newWallets }, { status: 201 });
      }

      case 'fund': {
        if (!masterWallet || !walletId) {
          return NextResponse.json(
            { error: 'Missing masterWallet or walletId' },
            { status: 400 }
          );
        }

        const wallet = wallets.get(walletId);
        if (!wallet) {
          return NextResponse.json(
            { error: 'Wallet not found' },
            { status: 404 }
          );
        }

        wallet.balance += body.amount || 0.1;
        wallets.set(walletId, wallet);

        return NextResponse.json({ wallet });
      }

      case 'recover': {
        if (!masterWallet) {
          return NextResponse.json(
            { error: 'Missing masterWallet' },
            { status: 400 }
          );
        }

        let totalRecovered = 0;
        const recoveredWallets = [];

        for (const [id, wallet] of wallets.entries()) {
          if (wallet.isActive) {
            totalRecovered += wallet.balance;
            wallet.balance = 0;
            wallet.isActive = false;
            wallets.set(id, wallet);
            recoveredWallets.push(id);
          }
        }

        return NextResponse.json({
          success: true,
          totalRecovered,
          recoveredCount: recoveredWallets.length,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate, fund, or recover' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process wallet action' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { walletId, isActive } = body;

    if (!walletId) {
      return NextResponse.json(
        { error: 'Missing walletId' },
        { status: 400 }
      );
    }

    const wallet = wallets.get(walletId);
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    wallet.isActive = isActive ?? wallet.isActive;
    wallets.set(walletId, wallet);

    return NextResponse.json({ wallet });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update wallet' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('id');

    if (!walletId) {
      return NextResponse.json(
        { error: 'Missing wallet id' },
        { status: 400 }
      );
    }

    const deleted = wallets.delete(walletId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete wallet' },
      { status: 500 }
    );
  }
}
