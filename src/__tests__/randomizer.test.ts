import { describe, it, expect } from 'bun:test';
import {
  gaussianRandom,
  truncatedGaussian,
  randomInRange,
  randomIntInRange,
  randomDelay,
  generateBuySellRatio,
  randomAmount,
  randomSlippage,
  randomPriorityFee,
  shouldExecuteMicroFail,
  shouldExecuteNoop,
} from '../utils/randomizer';

describe('Randomizer Utility', () => {
  describe('gaussianRandom', () => {
    it('should generate values within reasonable range', () => {
      const results = Array.from({ length: 1000 }, () => gaussianRandom(0, 1));
      const mean = results.reduce((a, b) => a + b, 0) / results.length;
      expect(mean).toBeGreaterThan(-3);
      expect(mean).toBeLessThan(3);
    });
  });

  describe('truncatedGaussian', () => {
    it('should return values within bounds', () => {
      const results = Array.from({ length: 100 }, () => truncatedGaussian(0, 10, 5, 2));
      results.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('randomInRange', () => {
    it('should return value within range', () => {
      const results = Array.from({ length: 100 }, () => randomInRange(5, 10));
      results.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(5);
        expect(val).toBeLessThan(10);
      });
    });
  });

  describe('randomIntInRange', () => {
    it('should return integer within range', () => {
      const results = Array.from({ length: 100 }, () => randomIntInRange(1, 5));
      results.forEach(val => {
        expect(Number.isInteger(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('randomDelay', () => {
    it('should return delay in milliseconds', () => {
      const delay = randomDelay(1, 5);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(5000);
    });
  });

  describe('generateBuySellRatio', () => {
    it('should return buy when ratio is 1', () => {
      const results = Array.from({ length: 100 }, () => generateBuySellRatio(1));
      expect(results.every(r => r === 'buy')).toBe(true);
    });

    it('should return sell when ratio is 0', () => {
      const results = Array.from({ length: 100 }, () => generateBuySellRatio(0));
      expect(results.every(r => r === 'sell')).toBe(true);
    });
  });

  describe('randomAmount', () => {
    it('should return amount within bounds', () => {
      const results = Array.from({ length: 100 }, () => randomAmount(0.1, 1.0));
      results.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0.1);
        expect(val).toBeLessThanOrEqual(1.0);
      });
    });
  });

  describe('randomSlippage', () => {
    it('should return slippage within bounds', () => {
      const results = Array.from({ length: 100 }, () => randomSlippage(1, 10));
      results.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('randomPriorityFee', () => {
    it('should return fee within bounds', () => {
      const results = Array.from({ length: 100 }, () => randomPriorityFee(0.001, 0.01));
      results.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0.001);
        expect(val).toBeLessThanOrEqual(0.01);
      });
    });
  });

  describe('shouldExecuteMicroFail', () => {
    it('should never trigger when chance is 0', () => {
      const results = Array.from({ length: 100 }, () => shouldExecuteMicroFail(0));
      expect(results.some(r => r === true)).toBe(false);
    });

    it('should always trigger when chance is 1', () => {
      const results = Array.from({ length: 100 }, () => shouldExecuteMicroFail(1));
      expect(results.every(r => r === true)).toBe(true);
    });
  });

  describe('shouldExecuteNoop', () => {
    it('should rarely return true (10% chance)', () => {
      const results = Array.from({ length: 1000 }, () => shouldExecuteNoop());
      const trueCount = results.filter(r => r === true).length;
      expect(trueCount).toBeGreaterThan(0);
      expect(trueCount).toBeLessThan(300);
    });
  });
});
