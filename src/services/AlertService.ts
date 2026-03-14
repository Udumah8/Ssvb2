import type { AlertConfig, Campaign } from '@/types';

export interface Alert {
  id: string;
  type: AlertConfig['type'];
  message: string;
  timestamp: Date;
  campaignId?: string;
  campaignName?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertThresholds {
  spendThreshold?: number;
  priceImpactThreshold?: number;
  txFailureThreshold?: number;
}

export class AlertService {
  private alertConfigs: Map<string, AlertConfig[]> = new Map();
  private alerts: Alert[] = [];
  private telegramWebhook?: string;
  private maxAlerts: number = 100;

  constructor(telegramWebhook?: string) {
    this.telegramWebhook = telegramWebhook;
  }

  setTelegramWebhook(webhook: string): void {
    this.telegramWebhook = webhook;
  }

  registerAlertConfig(campaignId: string, config: AlertConfig): void {
    const configs = this.alertConfigs.get(campaignId) || [];
    configs.push(config);
    this.alertConfigs.set(campaignId, configs);
  }

  removeAlertConfig(campaignId: string, configId: string): void {
    const configs = this.alertConfigs.get(campaignId);
    if (configs) {
      const filtered = configs.filter(c => c.id !== configId);
      this.alertConfigs.set(campaignId, filtered);
    }
  }

  getAlertConfigs(campaignId: string): AlertConfig[] {
    return this.alertConfigs.get(campaignId) || [];
  }

  getAllAlerts(): Alert[] {
    return [...this.alerts].reverse();
  }

  getAlertsByCampaign(campaignId: string): Alert[] {
    return this.alerts
      .filter(a => a.campaignId === campaignId)
      .reverse();
  }

  async checkThresholds(
    campaign: Campaign,
    thresholds: AlertThresholds
  ): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];
    const configs = this.getAlertConfigs(campaign.id);

    if (thresholds.spendThreshold) {
      const spendPercentage = (campaign.budget.spent / campaign.budget.total) * 100;
      if (spendPercentage >= thresholds.spendThreshold) {
        const alert = this.createAlert({
          type: 'spend-threshold',
          message: `Campaign "${campaign.name}" has reached ${spendPercentage.toFixed(1)}% of budget`,
          campaignId: campaign.id,
          campaignName: campaign.name,
          metadata: {
            spent: campaign.budget.spent,
            total: campaign.budget.total,
            percentage: spendPercentage,
          },
        });
        triggeredAlerts.push(alert);
      }
    }

    if (thresholds.priceImpactThreshold) {
      if (Math.abs(campaign.stats.priceImpact) >= thresholds.priceImpactThreshold) {
        const alert = this.createAlert({
          type: 'error',
          message: `Campaign "${campaign.name}" has high price impact: ${campaign.stats.priceImpact.toFixed(2)}%`,
          campaignId: campaign.id,
          campaignName: campaign.name,
          metadata: {
            priceImpact: campaign.stats.priceImpact,
          },
        });
        triggeredAlerts.push(alert);
      }
    }

    return triggeredAlerts;
  }

  createAlert(params: {
    type: Alert['type'];
    message: string;
    campaignId?: string;
    campaignName?: string;
    metadata?: Record<string, unknown>;
  }): Alert {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      message: params.message,
      timestamp: new Date(),
      campaignId: params.campaignId,
      campaignName: params.campaignName,
      metadata: params.metadata,
    };

    this.alerts.push(alert);

    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    this.sendNotification(alert);

    return alert;
  }

  async sendNotification(alert: Alert): Promise<void> {
    if (!this.telegramWebhook) {
      return;
    }

    try {
      const message = this.formatAlertMessage(alert);
      
      await fetch(this.telegramWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          parse_mode: 'HTML',
        }),
      });
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  }

  private formatAlertMessage(alert: Alert): string {
    const icon = this.getAlertIcon(alert.type);
    const time = alert.timestamp.toISOString();
    
    return `${icon} <b>${alert.type.toUpperCase().replace('-', ' ')}</b>\n\n${alert.message}\n\n⏰ ${time}`;
  }

  private getAlertIcon(type: Alert['type']): string {
    switch (type) {
      case 'spend-threshold':
        return '💰';
      case 'paused':
        return '⏸️';
      case 'error':
        return '❌';
      case 'completed':
        return '✅';
      default:
        return '🔔';
    }
  }

  clearAlerts(campaignId?: string): void {
    if (campaignId) {
      this.alerts = this.alerts.filter(a => a.campaignId !== campaignId);
    } else {
      this.alerts = [];
    }
  }

  getAlertStats(): {
    total: number;
    byType: Record<string, number>;
    byCampaign: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byCampaign: Record<string, number> = {};

    this.alerts.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1;
      if (alert.campaignId) {
        byCampaign[alert.campaignId] = (byCampaign[alert.campaignId] || 0) + 1;
      }
    });

    return {
      total: this.alerts.length,
      byType,
      byCampaign,
    };
  }
}

let alertServiceInstance: AlertService | null = null;

export function getAlertService(telegramWebhook?: string): AlertService {
  if (!alertServiceInstance) {
    alertServiceInstance = new AlertService(telegramWebhook);
  }
  return alertServiceInstance;
}
