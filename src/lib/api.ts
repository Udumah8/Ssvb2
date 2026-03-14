const API_BASE = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    return { error: error.error || 'Request failed' };
  }
  
  const data = await response.json();
  return { data };
}

export const campaignApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/campaigns`);
    return handleResponse<{ campaigns: unknown[] }>(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE}/campaigns/${id}`);
    return handleResponse<{ campaign: unknown }>(response);
  },

  create: async (campaign: {
    name: string;
    tokenMint: string;
    strategy: string;
    budget?: unknown;
    realism?: unknown;
  }) => {
    const response = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    });
    return handleResponse<{ campaign: unknown }>(response);
  },

  start: async (id: string) => {
    const response = await fetch(`${API_BASE}/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    });
    return handleResponse<{ campaign: unknown }>(response);
  },

  pause: async (id: string) => {
    const response = await fetch(`${API_BASE}/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' }),
    });
    return handleResponse<{ campaign: unknown }>(response);
  },

  stop: async (id: string) => {
    const response = await fetch(`${API_BASE}/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    });
    return handleResponse<{ campaign: unknown }>(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE}/campaigns/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(response);
  },
};

export const walletApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/wallets`);
    return handleResponse<{ wallets: unknown[]; stats: unknown }>(response);
  },

  generate: async (count: number = 10) => {
    const response = await fetch(`${API_BASE}/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate', count }),
    });
    return handleResponse<{ wallets: unknown[] }>(response);
  },

  fund: async (walletId: string, masterWallet: string, amount: number) => {
    const response = await fetch(`${API_BASE}/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fund', walletId, masterWallet, amount }),
    });
    return handleResponse<{ wallet: unknown }>(response);
  },

  recover: async (masterWallet: string) => {
    const response = await fetch(`${API_BASE}/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'recover', masterWallet }),
    });
    return handleResponse<{ success: boolean; totalRecovered: number }>(response);
  },

  setActive: async (walletId: string, isActive: boolean) => {
    const response = await fetch(`${API_BASE}/wallets`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletId, isActive }),
    });
    return handleResponse<{ wallet: unknown }>(response);
  },
};

export const settingsApi = {
  get: async () => {
    const response = await fetch(`${API_BASE}/settings`);
    return handleResponse<{ settings: unknown; presets: unknown[] }>(response);
  },

  save: async (settings: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', ...settings }),
    });
    return handleResponse<{ success: boolean; settings: unknown }>(response);
  },

  testRpc: async (rpcUrl?: string) => {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test-rpc', rpcUrl }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  loadPreset: async (presetId: string) => {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId }),
    });
    return handleResponse<{ preset: unknown }>(response);
  },
};

export const alertsApi = {
  getAll: async (campaignId?: string) => {
    const url = campaignId 
      ? `${API_BASE}/alerts?campaignId=${campaignId}` 
      : `${API_BASE}/alerts`;
    const response = await fetch(url);
    return handleResponse<{ alerts: unknown[]; stats: unknown }>(response);
  },

  registerConfig: async (config: {
    campaignId: string;
    type: string;
    threshold?: number;
    webhookUrl?: string;
    enabled?: boolean;
  }) => {
    const response = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'register-config', 
        campaignId: config.campaignId,
        type: config.type,
        threshold: config.threshold,
        webhookUrl: config.webhookUrl,
        enabled: config.enabled,
      }),
    });
    return handleResponse<{ config: unknown }>(response);
  },

  createAlert: async (alert: {
    type: string;
    message: string;
    campaignId?: string;
    campaignName?: string;
    webhookUrl?: string;
  }) => {
    const response = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'create-alert', 
        type: alert.type,
        message: alert.message,
        campaignId: alert.campaignId,
        campaignName: alert.campaignName,
        webhookUrl: alert.webhookUrl,
      }),
    });
    return handleResponse<{ alert: unknown }>(response);
  },

  clear: async (campaignId?: string) => {
    const response = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear', campaignId }),
    });
    return handleResponse<{ success: boolean }>(response);
  },
};
