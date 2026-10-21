import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
  isProcessing: boolean;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
    if (record.timestamps.length === 0 && !record.isProcessing) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export const RATE_LIMIT_MAX_PER_MINUTE = 10;
export const MAX_TEXT_LENGTH = 1200;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number; error?: string } {
  const now = Date.now();
  let record = rateLimitStore.get(ip);
  if (!record) {
    record = { timestamps: [], isProcessing: false };
    rateLimitStore.set(ip, record);
  }

  // Filter timestamps within last 60 seconds
  record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);

  if (record.isProcessing) {
    return {
      allowed: false,
      error: 'درخواست قبلی شما هنوز در حال پردازش است. لطفاً تا اتمام آن منتظر بمانید.',
    };
  }

  if (record.timestamps.length >= RATE_LIMIT_MAX_PER_MINUTE) {
    const oldestTs = record.timestamps[0];
    const waitSeconds = Math.ceil((60000 - (now - oldestTs)) / 1000);
    return {
      allowed: false,
      retryAfter: waitSeconds,
      error: `تعداد درخواست‌های شما به سقف مجاز (${RATE_LIMIT_MAX_PER_MINUTE} در دقیقه) رسیده است. لطفاً ${waitSeconds} ثانیه دیگر تلاش کنید.`,
    };
  }

  return { allowed: true };
}

export function startProcessing(ip: string): void {
  const record = rateLimitStore.get(ip);
  if (record) {
    record.isProcessing = true;
    record.timestamps.push(Date.now());
  } else {
    rateLimitStore.set(ip, { timestamps: [Date.now()], isProcessing: true });
  }
}

export function stopProcessing(ip: string): void {
  const record = rateLimitStore.get(ip);
  if (record) {
    record.isProcessing = false;
  }
}
