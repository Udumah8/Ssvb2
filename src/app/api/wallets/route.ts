import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, createRateLimitMiddleware } from '@/utils/rateLimit';
import { v4 as uuidv4 } from 'uuid';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 50,
});

const wallets = new Map();

function generateRealSolanaWallet(): { publicKey: string; privateKey: string } {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
  };
}

function isValidSolanaAddress(address: string): boolean {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
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
    const { action, count, walletId, masterWallet, privateKey } = body;

    switch (action) {
      case 'generate': {
        const walletCount = count || 10;
        const newWallets = [];

        for (let i = 0; i < walletCount; i++) {
          const { publicKey, privateKey: privKey } = generateRealSolanaWallet();
          const wallet = {
            id: uuidv4(),
            publicKey,
            privateKeyEncrypted: privKey,
            balance: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          wallets.set(wallet.id, wallet);
          newWallets.push(wallet);
        }

        return NextResponse.json({ wallets: newWallets }, { status: 201 });
      }

      case 'import': {
        if (!privateKey) {
          return NextResponse.json(
            { error: 'Missing private key' },
            { status: 400 }
          );
        }

        let publicKey: string;
        let privateKeyToStore: string;

        if (privateKey.length === 64) {
          const keypair = Keypair.fromSecretKey(
            new Uint8Array(Buffer.from(privateKey, 'hex'))
          );
          publicKey = keypair.publicKey.toBase58();
          privateKeyToStore = privateKey;
        } else if (isValidSolanaAddress(privateKey)) {
          return NextResponse.json(
            { error: 'Please provide a private key, not a public address' },
            { status: 400 }
          );
        } else {
          try {
            const decoded = bs58.decode(privateKey);
            if (decoded.length !== 32) {
              throw new Error('Invalid key length');
            }
            const keypair = Keypair.fromSecretKey(decoded);
            publicKey = keypair.publicKey.toBase58();
            privateKeyToStore = privateKey;
          } catch {
            return NextResponse.json(
              { error: 'Invalid private key format' },
              { status: 400 }
            );
          }
        }

        const existingWallet = Array.from(wallets.values()).find(
          (w: { publicKey: string }) => w.publicKey === publicKey
        );

        if (existingWallet) {
          return NextResponse.json(
            { error: 'Wallet already imported', wallet: existingWallet },
            { status: 409 }
          );
        }

        const wallet = {
          id: uuidv4(),
          publicKey,
          privateKeyEncrypted: privateKeyToStore,
          balance: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        wallets.set(wallet.id, wallet);

        return NextResponse.json({ wallet }, { status: 201 });
      }

      case 'fund': {
        if (!masterWallet || !walletId) {
          return NextResponse.json(
            { error: 'Missing masterWallet or walletId' },
            { status: 400 }
          );
        }

        if (!isValidSolanaAddress(masterWallet)) {
          return NextResponse.json(
            { error: 'Invalid master wallet address' },
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

        if (!isValidSolanaAddress(masterWallet)) {
          return NextResponse.json(
            { error: 'Invalid master wallet address' },
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
          { error: 'Invalid action. Use: generate, import, fund, or recover' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Wallet API error:', error);
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
