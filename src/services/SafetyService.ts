import type { Campaign, CampaignBudget } from '@/types';

export interface SafetyLimits {
  maxTotalSpend: number;
  maxDailySpend: number;
  maxPerHourSpend: number;
  maxSlippage: number;
  minSlippage: number;
  maxPriceImpact: number;
}

export interface SpendSnapshot {
  hourlySpend: Map<number, number>;
  dailySpend: Map<number, number>;
  totalSpend: number;
}

export class SafetyService {
  private limits: SafetyLimits;
  private spendSnapshots: Map<string, SpendSnapshot> = new Map();
  private hourlyResetInterval: NodeJS.Timeout | null = null;
  private dailyResetInterval: NodeJS.Timeout | null = null;

  constructor(limits: Partial<SafetyLimits> = {}) {
    this.limits = {
      maxTotalSpend: limits.maxTotalSpend ?? 100,
      maxDailySpend: limits.maxDailySpend ?? 20,
      maxPerHourSpend: limits.maxPerHourSpend ?? 5,
      maxSlippage: limits.maxSlippage ?? 15,
      minSlippage: limits.minSlippage ?? 1,
      maxPriceImpact: limits.maxPriceImpact ?? 10,
    };
  }

  updateLimits(limits: Partial<SafetyLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }

  getLimits(): SafetyLimits {
    return { ...this.limits };
  }

  initializeCampaignTracking(campaignId: string): void {
    this.spendSnapshots.set(campaignId, {
      hourlySpend: new Map(),
      dailySpend: new Map(),
      totalSpend: 0,
    });

    this.startPeriodicTracking(campaignId);
  }

  stopCampaignTracking(campaignId: string): void {
    this.spendSnapshots.delete(campaignId);
  }

  canSpend(campaignId: string, amount: number): boolean {
    const snapshot = this.spendSnapshots.get(campaignId);
    if (!snapshot) return false;

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDate();
    const hourlySpend = snapshot.hourlySpend.get(currentHour) || 0;
    const dailySpend = snapshot.dailySpend.get(currentDay) || 0;

    if (snapshot.totalSpend + amount > this.limits.maxTotalSpend) {
      return false;
    }
    if (hourlySpend + amount > this.limits.maxPerHourSpend) {
      return false;
    }
    if (dailySpend + amount > this.limits.maxDailySpend) {
      return false;
    }

    return true;
  }

  recordSpend(campaignId: string, amount: number): void {
    const snapshot = this.spendSnapshots.get(campaignId);
    if (!snapshot) return;

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDate();

    const hourlySpend = snapshot.hourlySpend.get(currentHour) || 0;
    snapshot.hourlySpend.set(currentHour, hourlySpend + amount);

    const dailySpend = snapshot.dailySpend.get(currentDay) || 0;
    snapshot.dailySpend.set(currentDay, dailySpend + amount);

    snapshot.totalSpend += amount;
  }

  validateBudget(budget: CampaignBudget): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (budget.total > this.limits.maxTotalSpend) {
      errors.push(`Total budget exceeds maximum of ${this.limits.maxTotalSpend} SOL`);
    }
    if (budget.daily > this.limits.maxDailySpend) {
      errors.push(`Daily budget exceeds maximum of ${this.limits.maxDailySpend} SOL`);
    }
    if (budget.perHour > this.limits.maxPerHourSpend) {
      errors.push(`Per-hour budget exceeds maximum of ${this.limits.maxPerHourSpend} SOL`);
    }
    if (budget.slippageMin < this.limits.minSlippage) {
      errors.push(`Minimum slippage must be at least ${this.limits.minSlippage}%`);
    }
    if (budget.slippageMax > this.limits.maxSlippage) {
      errors.push(`Maximum slippage cannot exceed ${this.limits.maxSlippage}%`);
    }
    if (budget.slippageMin > budget.slippageMax) {
      errors.push('Minimum slippage cannot be greater than maximum slippage');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateSlippage(slippage: number): boolean {
    return slippage >= this.limits.minSlippage && slippage <= this.limits.maxSlippage;
  }

  validatePriceImpact(priceImpact: number): boolean {
    return Math.abs(priceImpact) <= this.limits.maxPriceImpact;
  }

  checkThresholds(campaign: Campaign): {
    shouldPause: boolean;
    reason?: string;
  } {
    const snapshot = this.spendSnapshots.get(campaign.id);
    if (!snapshot) {
      return { shouldPause: false };
    }

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDate();
    const hourlySpend = snapshot.hourlySpend.get(currentHour) || 0;
    const dailySpend = snapshot.dailySpend.get(currentDay) || 0;

    if (snapshot.totalSpend >= campaign.budget.total * 0.95) {
      return { shouldPause: true, reason: 'Total budget nearly exhausted' };
    }
    if (hourlySpend >= campaign.budget.perHour * 0.95) {
      return { shouldPause: true, reason: 'Per-hour budget nearly exhausted' };
    }
    if (dailySpend >= campaign.budget.daily * 0.95) {
      return { shouldPause: true, reason: 'Daily budget nearly exhausted' };
    }
    if (this.validatePriceImpact(campaign.stats.priceImpact)) {
      return { shouldPause: true, reason: 'Price impact exceeds safety threshold' };
    }

    return { shouldPause: false };
  }

  getCurrentSpend(campaignId: string): {
    total: number;
    hourly: number;
    daily: number;
  } {
    const snapshot = this.spendSnapshots.get(campaignId);
    if (!snapshot) {
      return { total: 0, hourly: 0, daily: 0 };
    }

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDate();

    return {
      total: snapshot.totalSpend,
      hourly: snapshot.hourlySpend.get(currentHour) || 0,
      daily: snapshot.dailySpend.get(currentDay) || 0,
    };
  }

  private startPeriodicTracking(campaignId: string): void {
    const snapshot = this.spendSnapshots.get(campaignId);
    if (!snapshot) return;

    const resetHourly = () => {
      const currentHour = new Date().getHours();
      snapshot.hourlySpend.set(currentHour, 0);
    };

    const resetDaily = () => {
      const currentDay = new Date().getDate();
      snapshot.dailySpend.set(currentDay, 0);
    };

    this.hourlyResetInterval = setInterval(resetHourly, 60 * 60 * 1000);
    this.dailyResetInterval = setInterval(resetDaily, 24 * 60 * 60 * 1000);
  }

  cleanup(): void {
    if (this.hourlyResetInterval) {
      clearInterval(this.hourlyResetInterval);
    }
    if (this.dailyResetInterval) {
      clearInterval(this.dailyResetInterval);
    }
    this.spendSnapshots.clear();
  }
}
