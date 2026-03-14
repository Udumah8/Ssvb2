import { Keypair } from '@solana/web3.js';
import { v4 as uuidv4 } from 'uuid';
import { SolanaTradeService } from './SolanaTradeService';
import { WalletService } from './WalletService';
import type {
  Campaign,
  CampaignStrategy,
  CampaignStatus,
  CampaignBudget,
  RealismSettings,
  CampaignStats,
  Transaction,
} from '@/types';
import {
  randomInRange,
  randomIntInRange,
  generateBuySellRatio,
  randomAmount,
  randomSlippage,
  randomPriorityFee,
  randomDelay,
  shouldExecuteMicroFail,
  shouldExecuteNoop,
} from '@/utils/randomizer';

export class CampaignService {
  private solanaTradeService: SolanaTradeService;
  private walletService: WalletService;
  private campaigns: Map<string, Campaign> = new Map();
  private runningCampaigns: Set<string> = new Set();
  private campaignIntervals: Map<string, NodeJS.Timeout[]> = new Map();

  constructor(
    solanaTradeService: SolanaTradeService,
    walletService: WalletService
  ) {
    this.solanaTradeService = solanaTradeService;
    this.walletService = walletService;
  }

  createCampaign(
    name: string,
    tokenMint: string,
    strategy: CampaignStrategy,
    budget: CampaignBudget,
    realism: RealismSettings
  ): Campaign {
    const wallets = this.walletService.generateWallets(realism.walletCount);

    const campaign: Campaign = {
      id: uuidv4(),
      name,
      tokenMint,
      strategy,
      status: 'pending',
      budget: {
        ...budget,
        spent: 0,
      },
      realism,
      wallets,
      stats: {
        totalVolume: 0,
        transactionCount: 0,
        makerCount: 0,
        buyCount: 0,
        sellCount: 0,
        averagePrice: 0,
        priceImpact: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  getCampaign(id: string): Campaign | undefined {
    return this.campaigns.get(id);
  }

  getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  getRunningCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values()).filter(c => c.status === 'running');
  }

  async startCampaign(id: string): Promise<boolean> {
    const campaign = this.campaigns.get(id);
    if (!campaign || campaign.status !== 'pending' && campaign.status !== 'paused') {
      return false;
    }

    campaign.status = 'running';
    campaign.updatedAt = new Date();
    this.runningCampaigns.add(id);

    const intervals = this.startCampaignExecution(campaign);
    this.campaignIntervals.set(id, intervals);

    return true;
  }

  async pauseCampaign(id: string): Promise<boolean> {
    const campaign = this.campaigns.get(id);
    if (!campaign || campaign.status !== 'running') {
      return false;
    }

    campaign.status = 'paused';
    campaign.updatedAt = new Date();
    this.runningCampaigns.delete(id);

    const intervals = this.campaignIntervals.get(id);
    if (intervals) {
      intervals.forEach(clearInterval);
      this.campaignIntervals.delete(id);
    }

    return true;
  }

  async stopCampaign(id: string): Promise<boolean> {
    const campaign = this.campaigns.get(id);
    if (!campaign) {
      return false;
    }

    campaign.status = 'stopped';
    campaign.updatedAt = new Date();
    this.runningCampaigns.delete(id);

    const intervals = this.campaignIntervals.get(id);
    if (intervals) {
      intervals.forEach(clearInterval);
      this.campaignIntervals.delete(id);
    }

    return true;
  }

  async killCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    const campaign = this.campaigns.get(id);
    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    await this.stopCampaign(id);

    return { success: true };
  }

  updateCampaignStats(id: string, stats: Partial<CampaignStats>): void {
    const campaign = this.campaigns.get(id);
    if (campaign) {
      campaign.stats = { ...campaign.stats, ...stats };
      campaign.updatedAt = new Date();
    }
  }

  checkBudgetLimits(campaign: Campaign): boolean {
    const { budget } = campaign;
    return budget.spent < budget.total;
  }

  private startCampaignExecution(campaign: Campaign): NodeJS.Timeout[] {
    const intervals: NodeJS.Timeout[] = [];

    switch (campaign.strategy) {
      case 'drip':
        this.startDripMode(campaign, intervals);
        break;
      case 'burst':
        this.startBurstMode(campaign, intervals);
        break;
      case 'volume':
        this.startVolumeMode(campaign, intervals);
        break;
      case 'market-maker':
        this.startMarketMakerMode(campaign, intervals);
        break;
    }

    return intervals;
  }

  private startDripMode(campaign: Campaign, intervals: NodeJS.Timeout[]): void {
    const txPerMinuteMin = 1;
    const txPerMinuteMax = 5;
    const delay = (60 / randomIntInRange(txPerMinuteMin, txPerMinuteMax)) * 1000;

    const interval = setInterval(async () => {
      if (campaign.status !== 'running' || !this.checkBudgetLimits(campaign)) {
        if (!this.checkBudgetLimits(campaign)) {
          await this.pauseCampaign(campaign.id);
        }
        return;
      }

      await this.executeTrade(campaign);
    }, delay);

    intervals.push(interval);
  }

  private startBurstMode(campaign: Campaign, intervals: NodeJS.Timeout[]): void {
    const txPerMinuteMin = 10;
    const txPerMinuteMax = 50;
    const delay = (60 / randomIntInRange(txPerMinuteMin, txPerMinuteMax)) * 1000;

    const interval = setInterval(async () => {
      if (campaign.status !== 'running' || !this.checkBudgetLimits(campaign)) {
        if (!this.checkBudgetLimits(campaign)) {
          await this.pauseCampaign(campaign.id);
        }
        return;
      }

      await this.executeTrade(campaign);
    }, delay);

    intervals.push(interval);
  }

  private startVolumeMode(campaign: Campaign, intervals: NodeJS.Timeout[]): void {
    const delay = 500;

    const interval = setInterval(async () => {
      if (campaign.status !== 'running' || !this.checkBudgetLimits(campaign)) {
        if (!this.checkBudgetLimits(campaign)) {
          await this.pauseCampaign(campaign.id);
        }
        return;
      }

      const microAmount = randomInRange(0.001, 0.01);
      if (campaign.budget.spent + microAmount <= campaign.budget.total) {
        await this.executeTrade(campaign, microAmount);
      }
    }, delay);

    intervals.push(interval);
  }

  private startMarketMakerMode(campaign: Campaign, intervals: NodeJS.Timeout[]): void {
    const delay = 5000;

    const interval = setInterval(async () => {
      if (campaign.status !== 'running' || !this.checkBudgetLimits(campaign)) {
        if (!this.checkBudgetLimits(campaign)) {
          await this.pauseCampaign(campaign.id);
        }
        return;
      }

      const currentPrice = campaign.stats.averagePrice || 1;
      const priceRange = currentPrice * randomInRange(0.03, 0.1);
      const bidPrice = currentPrice - priceRange;
      const askPrice = currentPrice + priceRange;

      await this.executeTrade(campaign, randomAmount(campaign.realism.amountMin, campaign.realism.amountMax));
    }, delay);

    intervals.push(interval);
  }

  private async executeTrade(campaign: Campaign, overrideAmount?: number): Promise<void> {
    if (shouldExecuteNoop()) {
      return;
    }

    const activeWallets = campaign.wallets.filter(w => w.isActive);
    if (activeWallets.length === 0) return;

    const wallet = activeWallets[randomIntInRange(0, activeWallets.length - 1)];
    const keypair = this.walletService.getKeypairFromWallet(wallet);

    const type = generateBuySellRatio(campaign.realism.buyRatio);
    const amount = overrideAmount ?? randomAmount(
      campaign.realism.amountMin,
      campaign.realism.amountMax
    );
    const slippage = randomSlippage(
      campaign.budget.slippageMin,
      campaign.budget.slippageMax
    );
    const priorityFee = randomPriorityFee(
      campaign.budget.priorityFeeMin,
      campaign.budget.priorityFeeMax
    );

    try {
      let result;
      const tradeParams = {
        market: campaign.tokenMint,
        wallet: keypair,
        mint: campaign.tokenMint,
        amount,
        slippage,
        priorityFeeSol: priorityFee,
        antimev: true,
        skipSimulation: false,
      };

      if (type === 'buy') {
        result = await this.solanaTradeService.executeBuy(tradeParams);
      } else {
        result = await this.solanaTradeService.executeSell(tradeParams);
      }

      if (result.success) {
        campaign.stats.transactionCount++;
        campaign.stats.makerCount++;
        campaign.stats.totalVolume += amount;
        campaign.budget.spent += amount + priorityFee;
        
        if (type === 'buy') {
          campaign.stats.buyCount++;
        } else {
          campaign.stats.sellCount++;
        }

        campaign.updatedAt = new Date();
      }
    } catch (error) {
      if (!shouldExecuteMicroFail(campaign.realism.microFailChance)) {
        console.error('Trade execution failed:', error);
      }
    }
  }
}
