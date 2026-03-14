import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
} from '@solana/web3.js';
import type { Settings } from '@/types';

interface TradeResult {
  success: boolean;
  signature?: string;
  error?: string;
}

interface PriceResult {
  success: boolean;
  price?: number;
  error?: string;
}

export class SolanaTradeService {
  private connection: Connection;
  private settings: Settings;
  private retryCount: number = 3;
  private retryDelay: number = 1000;
  private solanaTradeInstance: unknown = null;

  constructor(settings: Settings) {
    this.settings = settings;
    this.connection = new Connection(settings.rpcUrl, {
      commitment: 'confirmed',
    });
  }

  async updateSettings(settings: Settings): Promise<void> {
    this.settings = settings;
    this.connection = new Connection(settings.rpcUrl, {
      commitment: 'confirmed',
    });
    this.solanaTradeInstance = null;
  }

  async initializeTradeLib(): Promise<void> {
    if (this.solanaTradeInstance) return;

    const { SolanaTrade } = await import('solana-trade');
    
    this.solanaTradeInstance = new SolanaTrade(this.settings.rpcUrl);
  }

  async executeBuy(params: {
    market: string;
    wallet: Keypair;
    mint: string;
    amount: number;
    slippage: number;
    priorityFeeSol?: number;
    tipAmountSol?: number;
    region?: string;
    antimev?: boolean;
    skipSimulation?: boolean;
  }): Promise<TradeResult> {
    return this.executeWithRetry(async () => {
      await this.initializeTradeLib();
      
      const TradeLib = this.solanaTradeInstance as { buy: (params: unknown) => Promise<{ signature: string }> };
      
      const result = await TradeLib.buy({
        market: params.market,
        wallet: params.wallet,
        mint: params.mint,
        amount: params.amount,
        slippage: params.slippage,
        priorityFeeSol: params.priorityFeeSol,
        tipAmountSol: params.tipAmountSol,
        region: params.region?.toUpperCase(),
        antimev: params.antimev ?? true,
        skipSimulation: params.skipSimulation ?? false,
      });
      
      return {
        success: true,
        signature: result.signature,
      };
    });
  }

  async executeSell(params: {
    market: string;
    wallet: Keypair;
    mint: string;
    amount: number;
    slippage: number;
    priorityFeeSol?: number;
    tipAmountSol?: number;
    region?: string;
    antimev?: boolean;
    skipSimulation?: boolean;
  }): Promise<TradeResult> {
    return this.executeWithRetry(async () => {
      await this.initializeTradeLib();
      
      const TradeLib = this.solanaTradeInstance as { sell: (params: unknown) => Promise<{ signature: string }> };
      
      const result = await TradeLib.sell({
        market: params.market,
        wallet: params.wallet,
        mint: params.mint,
        amount: params.amount,
        slippage: params.slippage,
        priorityFeeSol: params.priorityFeeSol,
        tipAmountSol: params.tipAmountSol,
        region: params.region?.toUpperCase(),
        antimev: params.antimev ?? true,
        skipSimulation: params.skipSimulation ?? false,
      });
      
      return {
        success: true,
        signature: result.signature,
      };
    });
  }

  async getPrice(mint: string, market: string): Promise<PriceResult> {
    return this.executeWithRetry(async () => {
      await this.initializeTradeLib();
      
      const TradeLib = this.solanaTradeInstance as { price: (params: unknown) => Promise<number> };
      
      const price = await TradeLib.price({ mint, market });
      
      return {
        success: true,
        price: Number(price),
      };
    });
  }

  async executeTransaction(
    transaction: Transaction,
    signers: Keypair[]
  ): Promise<TradeResult> {
    return this.executeWithRetry(async () => {
      try {
        const signature = await sendAndConfirmTransaction(
          this.connection,
          transaction,
          signers,
          {
            commitment: 'confirmed',
            maxRetries: 5,
          }
        );
        
        return {
          success: true,
          signature,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Transaction failed',
        };
      }
    });
  }

  async getBalance(publicKey: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(new PublicKey(publicKey));
      return balance / 1e9;
    } catch {
      return 0;
    }
  }

  async getTokenBalance(
    walletAddress: string,
    tokenMint: string
  ): Promise<number> {
    try {
      const tokenAccount = await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { mint: new PublicKey(tokenMint) }
      );
      
      if (tokenAccount.value.length === 0) return 0;
      
      const balance = tokenAccount.value[0].account.data.parsed.info.tokenAmount;
      return Number(balance.uiAmountString);
    } catch {
      return 0;
    }
  }

  async confirmTransaction(signature: string): Promise<boolean> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return status.value?.confirmationStatus === 'confirmed' ||
             status.value?.confirmationStatus === 'finalized';
    } catch {
      return false;
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.retryCount) {
        throw error;
      }
      
      const delay = this.retryDelay * Math.pow(2, attempt);
      await this.sleep(delay);
      
      return this.executeWithRetry(fn, attempt + 1);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
