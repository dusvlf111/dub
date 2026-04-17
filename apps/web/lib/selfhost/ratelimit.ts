/**
 * Self-hosted rate limiter using Redis.
 * Implements sliding window algorithm compatible with @upstash/ratelimit API.
 */
import { redis } from "./redis-compat";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<unknown>;
}

class SelfHostedRatelimit {
  private maxRequests: number;
  private windowMs: number;
  private prefix: string;

  constructor({
    maxRequests,
    windowMs,
    prefix,
  }: {
    maxRequests: number;
    windowMs: number;
    prefix: string;
  }) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.prefix = prefix;
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      // Simple sliding window counter using Redis
      const countKey = `${key}:count`;
      const resetKey = `${key}:reset`;

      const [currentCount, resetTime] = await Promise.all([
        redis.get<number>(countKey),
        redis.get<number>(resetKey),
      ]);

      // If reset time has passed, start fresh
      if (!resetTime || now > resetTime) {
        await Promise.all([
          redis.set(countKey, 1, { ex: Math.ceil(this.windowMs / 1000) }),
          redis.set(resetKey, now + this.windowMs, {
            ex: Math.ceil(this.windowMs / 1000),
          }),
        ]);
        return {
          success: true,
          limit: this.maxRequests,
          remaining: this.maxRequests - 1,
          reset: now + this.windowMs,
          pending: Promise.resolve(),
        };
      }

      const count = (currentCount || 0) + 1;

      if (count > this.maxRequests) {
        return {
          success: false,
          limit: this.maxRequests,
          remaining: 0,
          reset: resetTime,
          pending: Promise.resolve(),
        };
      }

      await redis.set(countKey, count, {
        ex: Math.ceil((resetTime - now) / 1000),
      });

      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - count,
        reset: resetTime,
        pending: Promise.resolve(),
      };
    } catch (error) {
      // On Redis failure, allow the request
      console.error("[SelfHostedRatelimit] Error:", error);
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests,
        reset: now + this.windowMs,
        pending: Promise.resolve(),
      };
    }
  }
}

function parseWindow(
  window:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d`,
): number {
  const match = window.match(/^(\d+)\s*(ms|s|m|h|d)$/);
  if (!match) return 10000;

  const value = parseInt(match[1]);
  switch (match[2]) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 10000;
  }
}

export const ratelimit = (
  requests: number = 10,
  seconds:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d` = "10 s",
) => {
  return new SelfHostedRatelimit({
    maxRequests: requests,
    windowMs: parseWindow(seconds),
    prefix: "dub",
  });
};
