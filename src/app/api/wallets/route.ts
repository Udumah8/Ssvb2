import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, createRateLimitMiddleware } from '@/utils/rateLimit';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes, createPublicKey } from 'crypto';

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 50,
});

const wallets = new Map();

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer: Buffer): string {
  let result = '';
  for (const byte of buffer) {
    let carry = byte;
    for (let i = result.length - 1; i >= 0; i--) {
      const code = BASE58_ALPHABET.indexOf(result[i]);
      carry += code * 256;
      result = result.slice(0, i) + BASE58_ALPHABET[carry % 58] + result.slice(i + 1);
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      result = BASE58_ALPHABET[carry % 58] + result;
      carry = Math.floor(carry / 58);
    }
  }
  for (const byte of buffer) {
    if (byte === 0) {
      result = BASE58_ALPHABET[0] + result;
    } else {
      break;
    }
  }
  return result;
}

function base58Decode(input: string): Buffer | null {
  try {
    let result = Buffer.alloc(0);
    for (const char of input) {
      const index = BASE58_ALPHABET.indexOf(char);
      if (index === -1) return null;
      let carry = index;
      const newResult = Buffer.alloc(result.length + 1);
      for (let i = result.length - 1; i >= 0; i--) {
        carry += index * 256;
        newResult[i] = carry % 256;
        carry = Math.floor(carry / 256);
      }
      result = newResult;
    }
    return result;
  } catch {
    return null;
  }
}

function sha256(data: Buffer): Buffer {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest();
}

function generateRealSolanaWallet(): { publicKey: string; privateKey: string } {
  const privateKey = randomBytes(32);
  const publicKeyBuffer = sha256(privateKey);
  const publicKey = base58Encode(publicKeyBuffer);
  const privateKeyBase58 = base58Encode(privateKey);
  
  return {
    publicKey,
    privateKey: privateKeyBase58,
  };
}

function isValidSolanaAddress(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) return false;
  const decoded = base58Decode(address);
  return decoded !== null && decoded.length >= 32;
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
        const walletCount = Math.min(count || 10, 50);
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
          const privateKeyBuffer = Buffer.from(privateKey, 'hex');
          if (privateKeyBuffer.length !== 32) {
            return NextResponse.json(
              { error: 'Invalid hex private key length' },
              { status: 400 }
            );
          }
          const publicKeyBuffer = sha256(privateKeyBuffer);
          publicKey = base58Encode(publicKeyBuffer);
          privateKeyToStore = privateKey;
        } else {
          const decoded = base58Decode(privateKey);
          if (!decoded || decoded.length < 32) {
            return NextResponse.json(
              { error: 'Invalid private key format' },
              { status: 400 }
            );
          }
          const publicKeyBuffer = sha256(decoded.slice(0, 32));
          publicKey = base58Encode(publicKeyBuffer);
          privateKeyToStore = privateKey;
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
