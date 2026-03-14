export interface Campaign {
  id: string;
  name: string;
  tokenMint: string;
  strategy: CampaignStrategy;
  status: CampaignStatus;
  budget: CampaignBudget;
  realism: RealismSettings;
  wallets: Wallet[];
  stats: CampaignStats;
  createdAt: Date;
  updatedAt: Date;
}

export type CampaignStrategy = 'drip' | 'burst' | 'volume' | 'market-maker';

export type CampaignStatus = 'pending' | 'running' | 'paused' | 'completed' | 'stopped';

export interface CampaignBudget {
  total: number;
  daily: number;
  perHour: number;
  spent: number;
  slippageMin: number;
  slippageMax: number;
  priorityFeeMin: number;
  priorityFeeMax: number;
}

export interface RealismSettings {
  walletCount: number;
  delayMin: number;
  delayMax: number;
  buyRatio: number;
  sellRatio: number;
  amountMin: number;
  amountMax: number;
  useNoopInstructions: boolean;
  microFailChance: number;
}

export interface Wallet {
  id: string;
  publicKey: string;
  privateKeyEncrypted: string;
  balance: number;
  isActive: boolean;
}

export interface CampaignStats {
  totalVolume: number;
  transactionCount: number;
  makerCount: number;
  buyCount: number;
  sellCount: number;
  averagePrice: number;
  priceImpact: number;
}

export interface Transaction {
  id: string;
  campaignId: string;
  signature: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  slippage: number;
  priorityFee: number;
  timestamp: Date;
  status: TransactionStatus;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface AlertConfig {
  id: string;
  type: 'spend-threshold' | 'paused' | 'error' | 'completed';
  threshold?: number;
  webhookUrl?: string;
  enabled: boolean;
}

export interface Settings {
  rpcUrl: string;
  jitoUuid?: string;
  nozomiApiKey?: string;
  astralaneApiKey?: string;
  defaultMevProvider: MevProvider;
  telegramWebhook?: string;
  emailAlerts?: string;
}

export type MevProvider = 'jito' | 'nozomi' | 'astralane' | 'none';

export interface BuyParams {
  market: string;
  wallet: string;
  mint: string;
  amount: number;
  slippage: number;
  priorityFeeSol?: number;
  tipAmountSol?: number;
  sender?: string;
  region?: string;
  antimev?: boolean;
  skipSimulation?: boolean;
}

export interface SellParams {
  market: string;
  wallet: string;
  mint: string;
  amount: number;
  slippage: number;
  priorityFeeSol?: number;
  tipAmountSol?: number;
  sender?: string;
  region?: string;
  antimev?: boolean;
  skipSimulation?: boolean;
}
