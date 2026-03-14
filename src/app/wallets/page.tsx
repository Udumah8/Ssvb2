'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { walletApi } from '@/lib/api';
import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Wallet, 
  ArrowLeft,
  RefreshCw,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';

interface WalletInfo {
  id: string;
  publicKey: string;
  privateKeyEncrypted?: string;
  balance: number;
  isActive: boolean;
  createdAt?: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [showBalances, setShowBalances] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [masterWallet, setMasterWallet] = useState('');
  const [amountPerWallet, setAmountPerWallet] = useState('0.1');
  const [walletCount, setWalletCount] = useState('10');

  const fetchWallets = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await walletApi.getAll();
    if (err) {
      setError(err);
    } else if (data?.wallets) {
      setWallets(data.wallets as WalletInfo[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWallets();
  }, []);

  const handleGenerateWallets = async () => {
    setGenerating(true);
    setError('');
    const count = parseInt(walletCount) || 10;
    const { data, error: err } = await walletApi.generate(count);
    if (err) {
      setError(err);
    } else if (data?.wallets) {
      setWallets([...wallets, ...(data.wallets as WalletInfo[])]);
    }
    setGenerating(false);
    fetchWallets();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleToggleActive = async (walletId: string, currentStatus: boolean) => {
    const { data, error: err } = await walletApi.setActive(walletId, !currentStatus);
    if (!err && data?.wallet) {
      setWallets(wallets.map(w => 
        w.id === walletId ? { ...w, isActive: !currentStatus } : w
      ));
    }
  };

  const handleDelete = async (walletId: string) => {
    const response = await fetch(`/api/wallets?id=${walletId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setWallets(wallets.filter(w => w.id !== walletId));
    }
  };

  const handleDistribute = async () => {
    if (!masterWallet) {
      setError('Please enter a master wallet address');
      return;
    }
    setDistributing(true);
    setError('');
    
    const amount = parseFloat(amountPerWallet) || 0.1;
    const count = parseInt(walletCount) || 10;
    
    for (let i = 0; i < Math.min(count, wallets.length); i++) {
      if (wallets[i].isActive) {
        await walletApi.fund(wallets[i].id, masterWallet, amount);
      }
    }
    
    setDistributing(false);
    fetchWallets();
  };

  const handleRecover = async () => {
    if (!masterWallet) {
      setError('Please enter a master wallet address');
      return;
    }
    setRecovering(true);
    setError('');
    
    const { data, error: err } = await walletApi.recover(masterWallet);
    if (err) {
      setError(err);
    }
    
    setRecovering(false);
    fetchWallets();
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

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
              <div className="text-2xl font-bold">{totalBalance.toFixed(4)} SOL</div>
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
            <Button variant="outline" onClick={fetchWallets} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input 
                type="number" 
                placeholder="Count"
                value={walletCount}
                onChange={(e) => setWalletCount(e.target.value)}
                className="w-20"
              />
            </div>
            <Button onClick={handleGenerateWallets} disabled={generating}>
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
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-slate-400" />
                <p className="text-slate-500 mt-2">Loading wallets...</p>
              </div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No wallets yet. Generate some to get started.</p>
              </div>
            ) : (
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
                        onClick={() => handleCopy(wallet.publicKey)}
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
                        onClick={() => handleToggleActive(wallet.id, wallet.isActive)}
                      >
                        <RefreshCw className={`h-4 w-4 ${wallet.isActive ? 'text-green-500' : 'text-slate-400'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(wallet.id)}>
                        <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px] space-y-2">
                <Label>Master Wallet</Label>
                <Input 
                  placeholder="Enter master wallet address" 
                  value={masterWallet}
                  onChange={(e) => setMasterWallet(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[150px] space-y-2">
                <Label>Amount per Wallet (SOL)</Label>
                <Input 
                  type="number" 
                  placeholder="0.1"
                  value={amountPerWallet}
                  onChange={(e) => setAmountPerWallet(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[150px] space-y-2">
                <Label>Number of Wallets</Label>
                <Input 
                  type="number" 
                  placeholder="50"
                  value={walletCount}
                  onChange={(e) => setWalletCount(e.target.value)}
                />
              </div>
              <Button onClick={handleDistribute} disabled={distributing || !masterWallet}>
                {distributing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Distribute Funds
              </Button>
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
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px] space-y-2">
                <Label>Master Wallet</Label>
                <Input 
                  placeholder="Enter master wallet address" 
                  value={masterWallet}
                  onChange={(e) => setMasterWallet(e.target.value)}
                />
              </div>
              <Button onClick={handleRecover} disabled={recovering || !masterWallet} variant="destructive">
                {recovering ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Recover All Funds
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
