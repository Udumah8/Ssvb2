import { Keypair } from '@solana/web3.js';
import { encrypt, decrypt } from '@/utils/encryption';
import type { Wallet } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class WalletService {
  private encryptionPassword: string;
  private wallets: Map<string, Wallet> = new Map();

  constructor(encryptionPassword: string) {
    this.encryptionPassword = encryptionPassword;
  }

  setEncryptionPassword(password: string): void {
    this.encryptionPassword = password;
  }

  generateWallet(): Wallet {
    const keypair = Keypair.generate();
    const privateKeyBase58 = this.keypairToBase58(keypair);
    const encryptedPrivateKey = encrypt(privateKeyBase58, this.encryptionPassword);

    const wallet: Wallet = {
      id: uuidv4(),
      publicKey: keypair.publicKey.toBase58(),
      privateKeyEncrypted: encryptedPrivateKey,
      balance: 0,
      isActive: true,
    };

    this.wallets.set(wallet.id, wallet);
    return wallet;
  }

  generateWallets(count: number): Wallet[] {
    const wallets: Wallet[] = [];
    for (let i = 0; i < count; i++) {
      wallets.push(this.generateWallet());
    }
    return wallets;
  }

  getWallet(id: string): Wallet | undefined {
    return this.wallets.get(id);
  }

  getAllWallets(): Wallet[] {
    return Array.from(this.wallets.values());
  }

  getActiveWallets(): Wallet[] {
    return Array.from(this.wallets.values()).filter(w => w.isActive);
  }

  updateWalletBalance(id: string, balance: number): void {
    const wallet = this.wallets.get(id);
    if (wallet) {
      wallet.balance = balance;
    }
  }

  setWalletActive(id: string, isActive: boolean): void {
    const wallet = this.wallets.get(id);
    if (wallet) {
      wallet.isActive = isActive;
    }
  }

  removeWallet(id: string): boolean {
    return this.wallets.delete(id);
  }

  decryptPrivateKey(encryptedPrivateKey: string): string {
    return decrypt(encryptedPrivateKey, this.encryptionPassword);
  }

  getKeypairFromWallet(wallet: Wallet): Keypair {
    const privateKeyBase58 = this.decryptPrivateKey(wallet.privateKeyEncrypted);
    return this.base58ToKeypair(privateKeyBase58);
  }

  serializeWallet(wallet: Wallet): string {
    return JSON.stringify({
      id: wallet.id,
      publicKey: wallet.publicKey,
      privateKeyEncrypted: wallet.privateKeyEncrypted,
      balance: wallet.balance,
      isActive: wallet.isActive,
    });
  }

  deserializeWallet(data: string): Wallet {
    const wallet = JSON.parse(data) as Wallet;
    this.wallets.set(wallet.id, wallet);
    return wallet;
  }

  serializeAllWallets(): string {
    const wallets = this.getAllWallets();
    return JSON.stringify(wallets.map(w => ({
      id: w.id,
      publicKey: w.publicKey,
      privateKeyEncrypted: w.privateKeyEncrypted,
      balance: w.balance,
      isActive: w.isActive,
    })));
  }

  loadWallets(data: string): void {
    const wallets = JSON.parse(data) as Wallet[];
    wallets.forEach(w => this.wallets.set(w.id, w));
  }

  clearWallets(): void {
    this.wallets.clear();
  }

  private keypairToBase58(keypair: Keypair): string {
    const bs58 = require('bs58');
    return bs58.encode(keypair.secretKey);
  }

  private base58ToKeypair(base58String: string): Keypair {
    const bs58 = require('bs58');
    const secretKey = bs58.decode(base58String);
    return Keypair.fromSecretKey(secretKey);
  }
}
