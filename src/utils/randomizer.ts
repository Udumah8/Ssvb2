export function gaussianRandom(mean: number = 0, stdDev: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

export function truncatedGaussian(
  min: number,
  max: number,
  mean: number,
  stdDev: number
): number {
  let value = gaussianRandom(mean, stdDev);
  while (value < min || value > max) {
    value = gaussianRandom(mean, stdDev);
  }
  return value;
}

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

export function randomDelay(minSeconds: number, maxSeconds: number): number {
  return randomInRange(minSeconds, maxSeconds) * 1000;
}

export function generateBuySellRatio(buyRatio: number): 'buy' | 'sell' {
  return Math.random() < buyRatio ? 'buy' : 'sell';
}

export function randomAmount(min: number, max: number): number {
  return truncatedGaussian(min, max, (min + max) / 2, (max - min) / 4);
}

export function randomSlippage(min: number, max: number): number {
  return truncatedGaussian(min, max, (min + max) / 2, (max - min) / 6);
}

export function randomPriorityFee(min: number, max: number): number {
  return truncatedGaussian(min, max, (min + max) / 2, (max - min) / 6);
}

export function shouldExecuteMicroFail(chance: number): boolean {
  return Math.random() < chance;
}

export function shouldExecuteNoop(): boolean {
  return Math.random() < 0.1;
}
