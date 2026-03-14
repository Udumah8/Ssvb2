import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const wallets = new Map();

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer: Uint8Array): string {
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

function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

function simpleHash(data: Uint8Array): Uint8Array {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const result = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    result[i] = (hash >> (i * 8)) & 255;
    if (result[i] < 0) result[i] += 256;
  }
  return result;
}

function generateSolanaWallet(): { publicKey: string; privateKey: string } {
  const privateKey = generateRandomBytes(32);
  const publicKeyBuffer = simpleHash(privateKey);
  const publicKey = base58Encode(publicKeyBuffer);
  const privateKeyBase58 = base58Encode(privateKey);
  
  return {
    publicKey,
    privateKey: privateKeyBase58,
  };
}

function isValidSolanaAddress(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) return false;
  for (const char of address) {
    if (BASE58_ALPHABET.indexOf(char) === -1) return false;
  }
  return true;
}

export async function GET() {
  try {
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
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, count, walletId, masterWallet, privateKey } = body;

    switch (action) {
      case 'generate': {
        const walletCount = Math.min(count || 10, 50);
        const newWallets = [];

        for (let i = 0; i < walletCount; i++) {
          const { publicKey, privateKey: privKey } = generateSolanaWallet();
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
          return NextResponse.json({ error: 'Missing private key' }, { status: 400 });
        }

        let publicKey: string;
        let privateKeyToStore: string;

        if (privateKey.length === 64) {
          const privateKeyBuffer = new Uint8Array(32);
          for (let i = 0; i < 32; i++) {
            privateKeyBuffer[i] = parseInt(privateKey.substr(i * 2, 2), 16);
          }
          const publicKeyBuffer = simpleHash(privateKeyBuffer);
          publicKey = base58Encode(publicKeyBuffer);
          privateKeyToStore = privateKey;
        } else {
          if (!isValidSolanaAddress(privateKey)) {
            return NextResponse.json({ error: 'Invalid private key format' }, { status: 400 });
          }
          const decoded = new Uint8Array(32);
          let idx = 0;
          for (const char of privateKey) {
            if (idx >= 32) break;
            decoded[idx++] = BASE58_ALPHABET.indexOf(char);
          }
          const publicKeyBuffer = simpleHash(decoded);
          publicKey = base58Encode(publicKeyBuffer);
          privateKeyToStore = privateKey;
        }

        const existingWallet = Array.from(wallets.values()).find(
          (w: { publicKey: string }) => w.publicKey === publicKey
        );

        if (existingWallet) {
          return NextResponse.json({ error: 'Wallet already imported', wallet: existingWallet }, { status: 409 });
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
          return NextResponse.json({ error: 'Missing masterWallet or walletId' }, { status: 400 });
        }

        if (!isValidSolanaAddress(masterWallet)) {
          return NextResponse.json({ error: 'Invalid master wallet address' }, { status: 400 });
        }

        const wallet = wallets.get(walletId);
        if (!wallet) {
          return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        wallet.balance += body.amount || 0.1;
        wallets.set(walletId, wallet);

        return NextResponse.json({ wallet });
      }

      case 'recover': {
        if (!masterWallet) {
          return NextResponse.json({ error: 'Missing masterWallet' }, { status: 400 });
        }

        if (!isValidSolanaAddress(masterWallet)) {
          return NextResponse.json({ error: 'Invalid master wallet address' }, { status: 400 });
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
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Failed to process wallet action' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletId, isActive } = body;

    if (!walletId) {
      return NextResponse.json({ error: 'Missing walletId' }, { status: 400 });
    }

    const wallet = wallets.get(walletId);
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    wallet.isActive = isActive ?? wallet.isActive;
    wallets.set(walletId, wallet);

    return NextResponse.json({ wallet });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('id');

    if (!walletId) {
      return NextResponse.json({ error: 'Missing wallet id' }, { status: 400 });
    }

    const deleted = wallets.delete(walletId);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 });
  }
}
