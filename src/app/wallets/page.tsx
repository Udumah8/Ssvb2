'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Wallet, 
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload
} from 'lucide-react';

interface WalletInfo {
  id: string;
  publicKey: string;
  balance: number;
  isActive: boolean;
}

const mockWallets: WalletInfo[] = [
  { id: '1', publicKey: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', balance: 0.5, isActive: true },
  { id: '2', publicKey: 'Ah22aCgL7S6w4qZ7v8N9J0K1L2M3N4O5P6Q7R8S9T0U', balance: 0.3, isActive: true },
  { id: '3', publicKey: 'Bj33bDpM8T7w5qY8R9S0K1T2U3V4W5X6Y7Z8A9B0C1', balance: 0.8, isActive: true },
  { id: '4', publicKey: 'Ck44cEqN9T8x6pZ9T0U1V2W3X4Y5Z6A7B8C9D0E1F2', balance: 0.2, isActive: false },
  { id: '5', publicKey: 'Dl55dFrO0U9y7qA1U2V3W4X5Y6Z7A8B9C0D1E2F3G4', balance: 0.6, isActive: true },
];

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>(mockWallets);
  const [showBalances, setShowBalances] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerateWallets = async (count: number) => {
    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const activeWallets = wallets.filter(w => w.isActive).length;

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Wallet Management</h1>
          <p className="text-slate-500 mt-1">Manage burner wallets for your campaigns</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wallets.length}</div>
              <p className="text-xs text-slate-500">Burner wallets</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
              <RefreshCw className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeWallets}</div>
              <p className="text-xs text-slate-500">Currently in rotation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBalance.toFixed(2)} SOL</div>
              <p className="text-xs text-slate-500">Across all wallets</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setShowBalances(!showBalances)}>
              {showBalances ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showBalances ? 'Hide' : 'Show'} Balances
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => handleGenerateWallets(10)} disabled={generating}>
              {generating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Generate Wallets
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Burner Wallets</CardTitle>
            <CardDescription>
              These wallets are used for generating volume. Private keys are encrypted server-side.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 px-4">
                <div className="col-span-1">Status</div>
                <div className="col-span-6">Public Key</div>
                <div className="col-span-3">Balance</div>
                <div className="col-span-2">Actions</div>
              </div>
              {wallets.map((wallet) => (
                <div 
                  key={wallet.id}
                  className="grid grid-cols-12 gap-4 items-center px-4 py-3 bg-slate-50 rounded-lg"
                >
                  <div className="col-span-1">
                    <div className={`w-3 h-3 rounded-full ${wallet.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                  </div>
                  <div className="col-span-6 font-mono text-sm">
                    {wallet.publicKey.slice(0, 12)}...{wallet.publicKey.slice(-12)}
                    <button 
                      onClick={() => copyToClipboard(wallet.publicKey)}
                      className="ml-2 text-slate-400 hover:text-slate-600"
                    >
                      <Copy className="h-3 w-3 inline" />
                    </button>
                  </div>
                  <div className="col-span-3">
                    {showBalances ? (
                      <span className="font-medium">{wallet.balance.toFixed(4)} SOL</span>
                    ) : (
                      <span className="text-slate-400">••••••</span>
                    )}
                  </div>
                  <div className="col-span-2 flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setWallets(wallets.map(w => 
                          w.id === wallet.id ? { ...w, isActive: !w.isActive } : w
                        ));
                      }}
                    >
                      <RefreshCw className={`h-4 w-4 ${wallet.isActive ? 'text-green-500' : 'text-slate-400'}`} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Fund Distribution</CardTitle>
            <CardDescription>
              Distribute SOL from master wallet to burners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>Master Wallet</Label>
                <Input placeholder="Enter master wallet address" />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Amount per Wallet (SOL)</Label>
                <Input type="number" placeholder="0.1" />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Number of Wallets</Label>
                <Input type="number" placeholder="50" />
              </div>
              <Button>Distribute Funds</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Fund Recovery</CardTitle>
            <CardDescription>
              Recover all funds from burners back to master wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>Master Wallet</Label>
                <Input placeholder="Enter master wallet address" />
              </div>
              <Button variant="destructive">Recover All Funds</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
