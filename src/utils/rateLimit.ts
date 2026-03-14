import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { success: boolean; remaining: number; resetTime: number } {
  const ip = getClientIP(request);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let record = rateLimitStore.get(ip);

  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(ip, record);
  }

  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

export function createRateLimitMiddleware(
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
) {
  return (request: NextRequest): NextResponse | null => {
    const result = checkRateLimit(request, config);

    if (!result.success) {
      const response = NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000) },
        { status: 429 }
      );
      response.headers.set('Retry-After', String(Math.ceil((result.resetTime - Date.now()) / 1000)));
      response.headers.set('X-RateLimit-Remaining', '0');
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetTime));
    return response;
  };
}
