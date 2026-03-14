'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Wallet, 
  Activity,
  Play,
  Pause,
  Square,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  tokenMint: string;
  strategy: string;
  status: 'running' | 'paused' | 'stopped' | 'pending';
  volume: number;
  txCount: number;
  makers: number;
  budgetUsed: number;
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'PEPE Launch',
    tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1o',
    strategy: 'drip',
    status: 'running',
    volume: 45.2,
    txCount: 1247,
    makers: 89,
    budgetUsed: 35,
  },
  {
    id: '2',
    name: 'BONK Boost',
    tokenMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixRb6xQqHZ7K9iG1i7v',
    strategy: 'burst',
    status: 'paused',
    volume: 128.5,
    txCount: 3892,
    makers: 234,
    budgetUsed: 72,
  },
];

const strategies = [
  { value: 'drip', label: 'Drip (1-5 tx/min)', description: 'Gradual steady volume' },
  { value: 'burst', label: 'Burst (10-50 tx/min)', description: 'High intensity spikes' },
  { value: 'volume', label: 'Volume Only', description: 'Maximize transactions' },
  { value: 'market-maker', label: 'Market Maker', description: 'Liquidity provision' },
];

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);

  const totalVolume = campaigns.reduce((sum, c) => sum + c.volume, 0);
  const totalTx = campaigns.reduce((sum, c) => sum + c.txCount, 0);
  const runningCampaigns = campaigns.filter(c => c.status === 'running').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-500';
      case 'paused': return 'text-yellow-500';
      case 'stopped': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">SVBB</span>
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

      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor and manage your volume campaigns</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVolume.toFixed(2)} SOL</div>
              <p className="text-xs text-slate-500">Across all campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Activity className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTx.toLocaleString()}</div>
              <p className="text-xs text-slate-500">Total tx count</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Play className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{runningCampaigns}</div>
              <p className="text-xs text-slate-500">Currently running</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unique Makers</CardTitle>
              <Clock className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaigns.reduce((sum, c) => sum + c.makers, 0)}
              </div>
              <p className="text-xs text-slate-500">Total makers</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Active Campaigns</h2>
          <Link href="/campaigns/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)} bg-slate-100`}>
                          {campaign.status}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100">
                          {strategies.find(s => s.value === campaign.strategy)?.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 font-mono">
                        {campaign.tokenMint.slice(0, 8)}...{campaign.tokenMint.slice(-8)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Volume</p>
                        <p className="text-lg font-semibold">{campaign.volume.toFixed(2)} SOL</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Tx Count</p>
                        <p className="text-lg font-semibold">{campaign.txCount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Makers</p>
                        <p className="text-lg font-semibold">{campaign.makers}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Budget</p>
                        <p className="text-lg font-semibold">{campaign.budgetUsed}%</p>
                      </div>
                      <div className="flex space-x-2">
                        {campaign.status === 'running' ? (
                          <Button variant="outline" size="icon" onClick={(e) => e.preventDefault()}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : campaign.status === 'paused' ? (
                          <Button variant="outline" size="icon" onClick={(e) => e.preventDefault()}>
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button variant="outline" size="icon" onClick={(e) => e.preventDefault()}>
                          <Square className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {campaigns.length === 0 && (
          <Card className="p-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-slate-500 mb-4">Create your first campaign to start boosting volume</p>
            <Link href="/campaigns/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}
