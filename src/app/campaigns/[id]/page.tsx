'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { campaignApi } from '@/lib/api';
import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Wallet, 
  ArrowLeft,
  Play,
  Pause,
  Square,
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface CampaignData {
  id: string;
  name: string;
  tokenMint: string;
  strategy: string;
  status: 'running' | 'paused' | 'stopped' | 'pending';
  budget: {
    total: number;
    spent: number;
  };
  stats: {
    totalVolume: number;
    transactionCount: number;
    makerCount: number;
  };
  realism?: {
    walletCount: number;
    buyRatio: number;
  };
  createdAt?: string;
}

interface Transaction {
  id: string;
  signature: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
}

const volumeData = [
  { time: '00:00', volume: 2.1 },
  { time: '04:00', volume: 1.8 },
  { time: '08:00', volume: 3.2 },
  { time: '12:00', volume: 5.4 },
  { time: '16:00', volume: 4.1 },
  { time: '20:00', volume: 6.2 },
  { time: '24:00', volume: 7.8 },
];

const makerData = [
  { time: '00:00', makers: 12 },
  { time: '04:00', makers: 18 },
  { time: '08:00', makers: 25 },
  { time: '12:00', makers: 34 },
  { time: '16:00', makers: 45 },
  { time: '20:00', makers: 67 },
  { time: '24:00', makers: 89 },
];

const buySellData = [
  { name: 'Buy', value: 65, color: '#22c55e' },
  { name: 'Sell', value: 35, color: '#ef4444' },
];

const mockTransactions: Transaction[] = [
  { id: '1', signature: '5Jk7...8R2K', type: 'buy', amount: 0.15, price: 0.042, timestamp: new Date().toISOString(), status: 'confirmed' },
  { id: '2', signature: '8Lm3...P9QX', type: 'sell', amount: 0.08, price: 0.044, timestamp: new Date(Date.now() - 60000).toISOString(), status: 'confirmed' },
  { id: '3', signature: '2Ab9...T4WH', type: 'buy', amount: 0.22, price: 0.043, timestamp: new Date(Date.now() - 120000).toISOString(), status: 'confirmed' },
  { id: '4', signature: '7Kc1...M6ZF', type: 'buy', amount: 0.11, price: 0.041, timestamp: new Date(Date.now() - 180000).toISOString(), status: 'confirmed' },
  { id: '5', signature: '4Pd2...L8VG', type: 'sell', amount: 0.05, price: 0.045, timestamp: new Date(Date.now() - 240000).toISOString(), status: 'confirmed' },
];

export default function CampaignDetail() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCampaign = async () => {
    setLoading(true);
    setError('');
    const id = params.id as string;
    const { data, error: err } = await campaignApi.getById(id);
    if (err) {
      setError(err);
    } else if (data?.campaign) {
      setCampaign(data.campaign as CampaignData);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-500';
      case 'paused': return 'text-yellow-500';
      case 'stopped': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const budgetPercentage = campaign ? (campaign.budget.spent / campaign.budget.total) * 100 : 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCampaign();
    setRefreshing(false);
  };

  const handlePause = async () => {
    if (!campaign) return;
    const { error } = await campaignApi.pause(campaign.id);
    if (!error) {
      setCampaign({ ...campaign, status: 'paused' });
    }
  };

  const handleResume = async () => {
    if (!campaign) return;
    const { error } = await campaignApi.start(campaign.id);
    if (!error) {
      setCampaign({ ...campaign, status: 'running' });
    }
  };

  const handleStop = async () => {
    if (!campaign) return;
    const { error } = await campaignApi.stop(campaign.id);
    if (!error) {
      setCampaign({ ...campaign, status: 'stopped' });
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    if (confirm('Are you sure you want to delete this campaign?')) {
      const { error } = await campaignApi.delete(campaign.id);
      if (!error) {
        router.push('/');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Campaign not found</h2>
          <p className="text-slate-500 mb-4">{error || 'The campaign you are looking for does not exist.'}</p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const buyRatio = campaign.realism?.buyRatio || 0.6;
  const sellRatio = 1 - buyRatio;
  const activeBuySellData = [
    { name: 'Buy', value: Math.round(buyRatio * 100), color: '#22c55e' },
    { name: 'Sell', value: Math.round(sellRatio * 100), color: '#ef4444' },
  ];
  const walletCount = campaign.realism?.walletCount || 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{campaign.name}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)} bg-slate-100`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-slate-500 mt-1 font-mono">
              {campaign.tokenMint.slice(0, 16)}...{campaign.tokenMint.slice(-16)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {campaign.status === 'running' ? (
              <Button variant="outline" onClick={handlePause}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            ) : campaign.status === 'paused' ? (
              <Button variant="outline" onClick={handleResume}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            ) : null}
            {campaign.status !== 'stopped' && (
              <Button variant="destructive" onClick={handleStop}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
            <Button variant="outline" onClick={handleDelete} className="text-red-500 border-red-200 hover:bg-red-50">
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(campaign.stats?.totalVolume || 0).toFixed(2)} SOL</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12.4%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Activity className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(campaign.stats?.transactionCount || 0).toLocaleString()}</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8.2%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unique Makers</CardTitle>
              <Clock className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.stats?.makerCount || 0}</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +5 new
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
              <Zap className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetPercentage.toFixed(1)}%</div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, budgetPercentage)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {campaign.budget.spent.toFixed(2)} / {campaign.budget.total} SOL
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Volume Over Time</CardTitle>
              <CardDescription>SOL volume generated per 4-hour window</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                    formatter={(value: number) => [`${value} SOL`, 'Volume']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#volumeGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maker Growth</CardTitle>
              <CardDescription>Unique maker addresses over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={makerData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                    formatter={(value: number) => [value, 'Makers']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="makers" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Buy/Sell Ratio</CardTitle>
              <CardDescription>Distribution of trade types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={activeBuySellData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {activeBuySellData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  <span className="text-sm">Buy ({activeBuySellData[0].value}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                  <span className="text-sm">Sell ({activeBuySellData[1].value}%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Active Wallets</CardTitle>
              <CardDescription>Wallet performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold">{walletCount}</div>
                  <div className="text-sm text-slate-500">Total Wallets</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold">{campaign.stats?.makerCount || 0}</div>
                  <div className="text-sm text-slate-500">Active</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold">{Math.max(0, walletCount - (campaign.stats?.makerCount || 0))}</div>
                  <div className="text-sm text-slate-500">Idle</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Average tx per wallet</span>
                  <span className="font-medium">
                    {campaign.stats?.makerCount ? (campaign.stats.transactionCount / campaign.stats.makerCount).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Average SOL per wallet</span>
                  <span className="font-medium">
                    {campaign.stats?.makerCount ? (campaign.stats.totalVolume / campaign.stats.makerCount).toFixed(4) : '0'} SOL
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Feed</CardTitle>
            <CardDescription>Recent transactions for this campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 px-4 pb-2">
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-4">Signature</div>
                <div className="col-span-2">Time</div>
              </div>
              {transactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="grid grid-cols-12 gap-4 items-center px-4 py-3 bg-slate-50 rounded-lg"
                >
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      tx.type === 'buy' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type === 'buy' ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {tx.type}
                    </span>
                  </div>
                  <div className="col-span-2 font-medium">{tx.amount.toFixed(4)} SOL</div>
                  <div className="col-span-2">${tx.price.toFixed(4)}</div>
                  <div className="col-span-4 font-mono text-sm text-slate-500">
                    {tx.signature}
                    <a 
                      href={`https://solscan.io/tx/${tx.signature}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="col-span-2 text-sm text-slate-500">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
