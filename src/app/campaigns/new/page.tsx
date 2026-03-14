'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { campaignApi } from '@/lib/api';
import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Wallet, 
  ArrowLeft,
  ArrowRight,
  Check,
  Zap,
  TrendingUp,
  Activity,
  Layers,
  AlertCircle,
  Loader2
} from 'lucide-react';

const steps = [
  { id: 1, name: 'Token', description: 'Select token' },
  { id: 2, name: 'Strategy', description: 'Choose strategy' },
  { id: 3, name: 'Budget', description: 'Set limits' },
  { id: 4, name: 'Realism', description: 'Configure' },
  { id: 5, name: 'Review', description: 'Launch' },
];

const strategies = [
  { 
    value: 'drip', 
    label: 'Drip / Steady', 
    description: 'Gradual 24/7 volume (1-5 tx/min)',
    icon: TrendingUp
  },
  { 
    value: 'burst', 
    label: 'Burst / High-Intensity', 
    description: 'Short aggressive spikes (10-50 tx/min)',
    icon: Zap
  },
  { 
    value: 'volume', 
    label: 'Volume Only', 
    description: 'Maximize tx with micro-swaps',
    icon: Activity
  },
  { 
    value: 'market-maker', 
    label: 'Market Maker', 
    description: 'Liquidity within price ranges (±3-10%)',
    icon: Layers
  },
];

export default function NewCampaign() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    tokenMint: '',
    strategy: '',
    campaignName: '',
    totalBudget: 10,
    dailyBudget: 5,
    perHourBudget: 1,
    slippageMin: 3,
    slippageMax: 12,
    priorityFeeMin: 0.001,
    priorityFeeMax: 0.005,
    walletCount: 100,
    delayMin: 1,
    delayMax: 60,
    buyRatio: 0.6,
    useNoop: true,
    microFailChance: 0.05,
  });

  const validateStep = (step: number): boolean => {
    setError('');
    switch (step) {
      case 1:
        if (!formData.campaignName.trim()) {
          setError('Please enter a campaign name');
          return false;
        }
        if (!formData.tokenMint.trim()) {
          setError('Please enter a token mint address');
          return false;
        }
        return true;
      case 2:
        if (!formData.strategy) {
          setError('Please select a strategy');
          return false;
        }
        return true;
      case 3:
        if (formData.totalBudget <= 0) {
          setError('Total budget must be greater than 0');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.campaignName.trim() || !formData.tokenMint.trim() || !formData.strategy) {
      setError('Please complete all required fields');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    const campaignData = {
      name: formData.campaignName,
      tokenMint: formData.tokenMint,
      strategy: formData.strategy,
      budget: {
        total: formData.totalBudget,
        daily: formData.dailyBudget,
        perHour: formData.perHourBudget,
        slippageMin: formData.slippageMin,
        slippageMax: formData.slippageMax,
        priorityFeeMin: formData.priorityFeeMin,
        priorityFeeMax: formData.priorityFeeMax,
      },
      realism: {
        walletCount: formData.walletCount,
        delayMin: formData.delayMin,
        delayMax: formData.delayMax,
        buyRatio: formData.buyRatio,
        sellRatio: 1 - formData.buyRatio,
        useNoopInstructions: formData.useNoop,
        microFailChance: formData.microFailChance,
      },
    };

    const { data, error: err } = await campaignApi.create(campaignData);
    
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }

    router.push('/');
  };

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
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">SVBB</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Campaign</h1>
          <p className="text-slate-500 mt-1">Set up a new volume boosting campaign</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Token Selection</CardTitle>
              <CardDescription>Enter the token mint address you want to boost</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input 
                  id="campaignName" 
                  placeholder="e.g., PEPE Launch"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({...formData, campaignName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenMint">Token Mint Address</Label>
                <Input 
                  id="tokenMint" 
                  placeholder="Enter token mint address"
                  value={formData.tokenMint}
                  onChange={(e) => setFormData({...formData, tokenMint: e.target.value})}
                />
                <p className="text-xs text-slate-500">
                  The SPL token mint address on Solana (e.g., from Pump.fun, Raydium)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Strategy Selection</CardTitle>
              <CardDescription>Choose how you want to generate volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.strategy === strategy.value 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setFormData({...formData, strategy: strategy.value})}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <strategy.icon className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{strategy.label}</span>
                    </div>
                    <p className="text-sm text-slate-500">{strategy.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Budget & Limits</CardTitle>
              <CardDescription>Configure spending limits and slippage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Total Budget (SOL)</Label>
                  <Input 
                    type="number" 
                    value={formData.totalBudget}
                    onChange={(e) => setFormData({...formData, totalBudget: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Daily Budget (SOL)</Label>
                  <Input 
                    type="number" 
                    value={formData.dailyBudget}
                    onChange={(e) => setFormData({...formData, dailyBudget: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per-Hour Budget (SOL)</Label>
                  <Input 
                    type="number" 
                    value={formData.perHourBudget}
                    onChange={(e) => setFormData({...formData, perHourBudget: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slippage Range (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      placeholder="Min"
                      value={formData.slippageMin}
                      onChange={(e) => setFormData({...formData, slippageMin: parseFloat(e.target.value)})}
                    />
                    <span>-</span>
                    <Input 
                      type="number" 
                      placeholder="Max"
                      value={formData.slippageMax}
                      onChange={(e) => setFormData({...formData, slippageMax: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Priority Fee (SOL)</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      placeholder="Min"
                      step="0.0001"
                      value={formData.priorityFeeMin}
                      onChange={(e) => setFormData({...formData, priorityFeeMin: parseFloat(e.target.value)})}
                    />
                    <span>-</span>
                    <Input 
                      type="number" 
                      placeholder="Max"
                      step="0.0001"
                      value={formData.priorityFeeMax}
                      onChange={(e) => setFormData({...formData, priorityFeeMax: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Realism Settings</CardTitle>
              <CardDescription>Configure randomization to avoid detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Wallets</Label>
                  <Input 
                    type="number" 
                    value={formData.walletCount}
                    onChange={(e) => setFormData({...formData, walletCount: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-slate-500">100-500 recommended</p>
                </div>
                <div className="space-y-2">
                  <Label>Delay Range (seconds)</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      value={formData.delayMin}
                      onChange={(e) => setFormData({...formData, delayMin: parseInt(e.target.value)})}
                    />
                    <span>-</span>
                    <Input 
                      type="number" 
                      value={formData.delayMax}
                      onChange={(e) => setFormData({...formData, delayMax: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Buy Ratio ({Math.round(formData.buyRatio * 100)}%)</Label>
                  <Input 
                    type="range" 
                    min="0"
                    max="1"
                    step="0.05"
                    value={formData.buyRatio}
                    onChange={(e) => setFormData({...formData, buyRatio: parseFloat(e.target.value)})}
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Sell</span>
                    <span>Buy</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Micro-Fail Chance ({Math.round(formData.microFailChance * 100)}%)</Label>
                  <Input 
                    type="range" 
                    min="0"
                    max="0.2"
                    step="0.01"
                    value={formData.microFailChance}
                    onChange={(e) => setFormData({...formData, microFailChance: parseFloat(e.target.value)})}
                  />
                  <p className="text-xs text-slate-500">Occasional failed tx for realism</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Launch</CardTitle>
              <CardDescription>Review your campaign settings before launching</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Campaign Name</span>
                  <span className="font-medium">{formData.campaignName || 'Unnamed'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Token</span>
                  <span className="font-mono text-sm">{formData.tokenMint.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Strategy</span>
                  <span className="font-medium capitalize">{formData.strategy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Budget</span>
                  <span className="font-medium">{formData.totalBudget} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wallets</span>
                  <span className="font-medium">{formData.walletCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Buy/Sell Ratio</span>
                  <span className="font-medium">{Math.round(formData.buyRatio * 100)}/{Math.round((1 - formData.buyRatio) * 100)}</span>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This tool is for simulation and testing purposes only. 
                  Ensure compliance with all applicable laws and platform terms of service.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 1 || submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {currentStep < 5 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Launch Campaign
            </Button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
      </main>
    </div>
  );
}
