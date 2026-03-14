import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const alerts: Array<{
  id: string;
  type: string;
  message: string;
  timestamp: string;
  campaignId?: string;
  campaignName?: string;
  metadata?: Record<string, unknown>;
}> = [];

const alertConfigs: Map<string, Array<{
  id: string;
  type: string;
  threshold?: number;
  webhookUrl?: string;
  enabled: boolean;
}>> = new Map();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');

    let filteredAlerts = alerts;
    if (campaignId) {
      filteredAlerts = alerts.filter(a => a.campaignId === campaignId);
    }

    const stats = {
      total: alerts.length,
      byType: alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      alerts: filteredAlerts.reverse(),
      stats,
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'register-config': {
        if (!data.campaignId) {
          return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
        }

        const config = {
          id: uuidv4(),
          type: data.type || 'spend-threshold',
          threshold: data.threshold,
          webhookUrl: data.webhookUrl,
          enabled: data.enabled ?? true,
        };

        const configs = alertConfigs.get(data.campaignId) || [];
        configs.push(config);
        alertConfigs.set(data.campaignId, configs);

        return NextResponse.json({ config }, { status: 201 });
      }

      case 'remove-config': {
        if (!data.campaignId || !data.configId) {
          return NextResponse.json({ error: 'Missing campaignId or configId' }, { status: 400 });
        }

        const configs = alertConfigs.get(data.campaignId) || [];
        const filtered = configs.filter(c => c.id !== data.configId);
        alertConfigs.set(data.campaignId, filtered);

        return NextResponse.json({ success: true });
      }

      case 'create-alert': {
        const alert = {
          id: uuidv4(),
          type: data.type || 'info',
          message: data.message || '',
          timestamp: new Date().toISOString(),
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          metadata: data.metadata,
        };

        alerts.push(alert);

        if (alerts.length > 100) {
          alerts.shift();
        }

        if (data.webhookUrl) {
          fetch(data.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert),
          }).catch(console.error);
        }

        return NextResponse.json({ alert }, { status: 201 });
      }

      case 'clear': {
        if (data.campaignId) {
          const filtered = alerts.filter(a => a.campaignId !== data.campaignId);
          alerts.length = 0;
          alerts.push(...filtered);
        } else {
          alerts.length = 0;
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Failed to process alert action' }, { status: 500 });
  }
}
