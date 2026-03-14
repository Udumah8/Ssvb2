'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { settingsApi } from '@/lib/api';
import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Wallet, 
  ArrowLeft,
  Save,
  Shield,
  Bell,
  Server,
  Zap,
  Key,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    jitoUuid: '',
    nozomiApiKey: '',
    astralaneApiKey: '',
    mevProvider: 'jito',
    telegramWebhook: '',
    emailAlerts: '',
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await settingsApi.get();
    if (data?.settings) {
      const s = data.settings as Record<string, string>;
      setSettings({
        rpcUrl: s.rpcUrl || settings.rpcUrl,
        jitoUuid: '',
        nozomiApiKey: '',
        astralaneApiKey: '',
        mevProvider: s.defaultMevProvider || 'jito',
        telegramWebhook: s.telegramWebhook === 'configured' ? '' : s.telegramWebhook || '',
        emailAlerts: s.emailAlerts === 'configured' ? '' : s.emailAlerts || '',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    const { data, error } = await settingsApi.save({
      rpcUrl: settings.rpcUrl,
      jitoUuid: settings.jitoUuid,
      nozomiApiKey: settings.nozomiApiKey,
      astralaneApiKey: settings.astralaneApiKey,
      defaultMevProvider: settings.mevProvider,
      telegramWebhook: settings.telegramWebhook,
      emailAlerts: settings.emailAlerts,
    });
    
    if (error) {
      setMessage({ type: 'error', text: error });
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    }
    setSaving(false);
  };

  const handleTestRpc = async () => {
    setTesting(true);
    setMessage(null);
    
    const { data, error } = await settingsApi.testRpc(settings.rpcUrl);
    
    if (error) {
      setMessage({ type: 'error', text: error });
    } else if (data?.success) {
      setMessage({ type: 'success', text: 'RPC connection successful!' });
    } else {
      setMessage({ type: 'error', text: data?.message || 'RPC test failed' });
    }
    setTesting(false);
  };

  const handleLoadPreset = async (presetId: string) => {
    const { data, error } = await settingsApi.loadPreset(presetId);
    if (data?.preset) {
      const preset = data.preset as { settings: Record<string, unknown> };
      setMessage({ type: 'success', text: `Loaded preset: ${presetId}` });
    } else if (error) {
      setMessage({ type: 'error', text: error });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/campaigns/new">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </Link>
            <Link href="/wallets">
              <Button variant="ghost" size="sm">
                <Wallet className="h-4 w-4 mr-2" />
                Wallets
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-500 mt-1">Configure your SVBB preferences</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{message.text}</span>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              RPC Configuration
            </CardTitle>
            <CardDescription>
              Configure your Solana RPC endpoint for optimal performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>RPC URL</Label>
              <div className="flex space-x-2">
                <Input 
                  value={settings.rpcUrl}
                  onChange={(e) => setSettings({...settings, rpcUrl: e.target.value})}
                  placeholder="https://api.mainnet-beta.solana.com"
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleTestRpc} disabled={testing}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Recommended: Helius, QuickNode, or Triton for production use
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              MEV Protection
            </CardTitle>
            <CardDescription>
              Configure MEV protection providers to avoid front-running
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default MEV Provider</Label>
              <Select 
                value={settings.mevProvider}
                onValueChange={(value) => setSettings({...settings, mevProvider: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jito">Jito</SelectItem>
                  <SelectItem value="nozomi">Nozomi</SelectItem>
                  <SelectItem value="astralane">Astralane</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jito UUID</Label>
              <Input 
                value={settings.jitoUuid}
                onChange={(e) => setSettings({...settings, jitoUuid: e.target.value})}
                placeholder="Enter your Jito UUID"
              />
            </div>
            <div className="space-y-2">
              <Label>Nozomi API Key</Label>
              <Input 
                value={settings.nozomiApiKey}
                onChange={(e) => setSettings({...settings, nozomiApiKey: e.target.value})}
                placeholder="Enter your Nozomi API key"
              />
            </div>
            <div className="space-y-2">
              <Label>Astralane API Key</Label>
              <Input 
                value={settings.astralaneApiKey}
                onChange={(e) => setSettings({...settings, astralaneApiKey: e.target.value})}
                placeholder="Enter your Astralane API key"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure alert notifications for campaign events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Telegram Webhook URL</Label>
              <Input 
                value={settings.telegramWebhook}
                onChange={(e) => setSettings({...settings, telegramWebhook: e.target.value})}
                placeholder="https://api.telegram.org/..."
              />
              <p className="text-xs text-slate-500">
                Get notifications via Telegram when campaigns hit thresholds
              </p>
            </div>
            <div className="space-y-2">
              <Label>Email Alerts</Label>
              <Input 
                value={settings.emailAlerts}
                onChange={(e) => setSettings({...settings, emailAlerts: e.target.value})}
                placeholder="your@email.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security
            </CardTitle>
            <CardDescription>
              Security settings and encryption configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Encryption Password</Label>
              <Input 
                type="password"
                placeholder="Enter encryption password"
              />
              <p className="text-xs text-slate-500">
                This password is used to encrypt burner wallet private keys
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Presets
            </CardTitle>
            <CardDescription>
              Save and load campaign configuration presets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">Aggressive Mode</p>
                <p className="text-sm text-slate-500">500 wallets, 60/40 buy ratio, burst mode</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleLoadPreset('aggressive')}>Load</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg mt-2">
              <div>
                <p className="font-medium">Stealth Mode</p>
                <p className="text-sm text-slate-500">100 wallets, 70/30 buy ratio, drip mode</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleLoadPreset('stealth')}>Load</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </main>
    </div>
  );
}
