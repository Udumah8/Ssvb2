export function isValidSolanaAddress(address: string): boolean {
  const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return SOLANA_ADDRESS_REGEX.test(address);
}

export function isValidMintAddress(address: string): boolean {
  if (!isValidSolanaAddress(address)) return false;
  const TOKEN_MINT_LENGTHS = [44, 32];
  return TOKEN_MINT_LENGTHS.includes(address.length);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidRpcUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  return url.startsWith('https://');
}

export function validateCampaignName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Campaign name is required' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Campaign name must be less than 100 characters' };
  }
  return { valid: true };
}

export function validateBudget(
  total: number,
  daily: number,
  perHour: number
): { valid: boolean; error?: string } {
  if (total <= 0 || daily <= 0 || perHour <= 0) {
    return { valid: false, error: 'Budget values must be positive' };
  }
  if (daily > total) {
    return { valid: false, error: 'Daily budget cannot exceed total budget' };
  }
  if (perHour > daily) {
    return { valid: false, error: 'Per-hour budget cannot exceed daily budget' };
  }
  return { valid: true };
}

export function validateRealismSettings(settings: {
  walletCount: number;
  buyRatio: number;
  delayMin: number;
  delayMax: number;
}): { valid: boolean; error?: string } {
  if (settings.walletCount < 1 || settings.walletCount > 1000) {
    return { valid: false, error: 'Wallet count must be between 1 and 1000' };
  }
  if (settings.buyRatio < 0 || settings.buyRatio > 1) {
    return { valid: false, error: 'Buy ratio must be between 0 and 1' };
  }
  if (settings.delayMin < 0 || settings.delayMax < settings.delayMin) {
    return { valid: false, error: 'Invalid delay range' };
  }
  return { valid: true };
}
