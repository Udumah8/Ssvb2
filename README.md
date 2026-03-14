# Solana Volume Booster Bot (SVBB)

A production-grade automated tool for simulating realistic trading activity on the Solana blockchain.

## Overview

SVBB generates on-chain volume, transaction count (makers), and activity signals for Solana tokens on major DEXs and launchpads to improve visibility on aggregators like DexScreener and Birdeye, while avoiding drastic price impact or detectable bot patterns.

## Core Philosophy

**Realism above all** - Achieved through:
- Multi-wallet distribution
- Heavy randomization
- Organic-like behavior
- MEV-protected execution

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui, Recharts
- **Blockchain**: Solana Web3.js, solana-trade library
- **Wallet**: @solana/wallet-adapter-react

## Features

### Trading Strategies
- **Drip/Steady Mode**: Gradual 24/7 volume (1-5 tx/min/wallet)
- **Burst/High-Intensity Mode**: Short aggressive spikes (10-50 tx/min)
- **Volume-Only Mode**: Maximize transactions with micro-swaps
- **Market Maker Style**: Liquidity provision within price ranges (±3-10%)

### Realism Engine
- 100-500+ burner wallets with random rotation
- Gaussian/truncated randomization for amounts, delays, slippage
- Buy/sell ratio configuration (default 60/40)
- Organic behaviors (noop instructions, micro-fails)

### Safety Controls
- SOL spend caps (daily, total, per-hour)
- Auto-pause on threshold breach
- Kill-switch with instant stop and fund recovery

### Web Dashboard
- Campaign creation wizard
- Real-time monitoring with charts
- Transaction feed with signatures
- Wallet management

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm
- Solana RPC endpoint (Helius, QuickNode recommended)
- MEV protection keys (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd solana-volume-booster-bot

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Configure .env with your settings
# Required: RPC_URL, ENCRYPTION_PASSWORD
# Optional: JITO_UUID, NOZOMI_API_KEY, ASTRALANE_API_KEY
```

### Development

```bash
# Start development server
bun dev
```

### Production

```bash
# Build the application
bun build

# Start production server
bun start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RPC_URL` | Yes | Solana RPC endpoint URL |
| `JITO_UUID` | No | Jito MEV protection UUID |
| `NOZOMI_API_KEY` | No | Nozomi API key |
| `ASTRALANE_API_KEY` | No | Astralane API key |
| `ENCRYPTION_PASSWORD` | Yes | Password for encrypting wallet keys |
| `TELEGRAM_WEBHOOK_URL` | No | Telegram webhook for alerts |

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── campaigns/          # Campaign management pages
│   ├── wallets/           # Wallet management page
│   ├── settings/          # Settings page
│   └── page.tsx           # Dashboard
├── components/
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── services/              # Business logic services
│   ├── SolanaTradeService.ts
│   ├── WalletService.ts
│   ├── CampaignService.ts
│   ├── SafetyService.ts
│   └── AlertService.ts
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
    ├── encryption.ts
    ├── randomizer.ts
    ├── validation.ts
    └── rateLimit.ts
```

## Testing

```bash
# Run all tests
bun test
```

## Security

- Wallet private keys are encrypted server-side using AES-256-GCM
- No private keys stored in browser
- Security headers (CSP, X-Frame-Options, etc.)
- Rate limiting on API routes
- Input validation on all forms

## Disclaimer

This tool is for simulation and testing purposes only. Users are solely responsible for compliance with all applicable laws and platform terms of service. Cryptocurrency trading carries substantial risk.

## License

MIT
