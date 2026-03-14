import { describe, it, expect } from 'bun:test';
import {
  isValidSolanaAddress,
  isValidMintAddress,
  isValidUrl,
  isValidRpcUrl,
  validateCampaignName,
  validateBudget,
  validateRealismSettings,
} from '../utils/validation';

describe('Validation Utility', () => {
  describe('isValidSolanaAddress', () => {
    it('should validate correct Solana addresses', () => {
      const validAddresses = [
        '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1o',
      ];
      validAddresses.forEach(addr => {
        expect(isValidSolanaAddress(addr)).toBe(true);
      });
    });

    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        'invalid',
        '123',
        'short',
        '0x1234567890abcdef',
      ];
      invalidAddresses.forEach(addr => {
        expect(isValidSolanaAddress(addr)).toBe(false);
      });
    });
  });

  describe('isValidMintAddress', () => {
    it('should validate correct mint addresses', () => {
      expect(isValidMintAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1o')).toBe(true);
    });

    it('should reject invalid mint addresses', () => {
      expect(isValidMintAddress('short')).toBe(false);
      expect(isValidMintAddress('invalid')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isValidRpcUrl', () => {
    it('should validate HTTPS RPC URLs', () => {
      expect(isValidRpcUrl('https://api.mainnet-beta.solana.com')).toBe(true);
    });

    it('should reject non-HTTPS URLs', () => {
      expect(isValidRpcUrl('http://localhost:3000')).toBe(false);
      expect(isValidRpcUrl('not-a-url')).toBe(false);
    });
  });

  describe('validateCampaignName', () => {
    it('should validate correct campaign names', () => {
      expect(validateCampaignName('My Campaign').valid).toBe(true);
      expect(validateCampaignName('PEPE Launch').valid).toBe(true);
    });

    it('should reject empty names', () => {
      const result = validateCampaignName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Campaign name is required');
    });

    it('should reject names exceeding 100 characters', () => {
      const longName = 'a'.repeat(101);
      const result = validateCampaignName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Campaign name must be less than 100 characters');
    });
  });

  describe('validateBudget', () => {
    it('should validate correct budgets', () => {
      const result = validateBudget(100, 20, 5);
      expect(result.valid).toBe(true);
    });

    it('should reject negative budgets', () => {
      const result = validateBudget(-1, 10, 5);
      expect(result.valid).toBe(false);
    });

    it('should reject daily exceeding total', () => {
      const result = validateBudget(10, 20, 5);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Daily budget cannot exceed total budget');
    });

    it('should reject per-hour exceeding daily', () => {
      const result = validateBudget(100, 10, 20);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Per-hour budget cannot exceed daily budget');
    });
  });

  describe('validateRealismSettings', () => {
    it('should validate correct settings', () => {
      const result = validateRealismSettings({
        walletCount: 100,
        buyRatio: 0.6,
        delayMin: 1,
        delayMax: 60,
      });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid wallet count', () => {
      const result = validateRealismSettings({
        walletCount: 0,
        buyRatio: 0.6,
        delayMin: 1,
        delayMax: 60,
      });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid buy ratio', () => {
      const result = validateRealismSettings({
        walletCount: 100,
        buyRatio: 1.5,
        delayMin: 1,
        delayMax: 60,
      });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid delay range', () => {
      const result = validateRealismSettings({
        walletCount: 100,
        buyRatio: 0.6,
        delayMin: 60,
        delayMax: 1,
      });
      expect(result.valid).toBe(false);
    });
  });
});
