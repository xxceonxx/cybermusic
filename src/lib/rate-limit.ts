import type { NextRequest } from "next/server";
import { TooMany } from "./api-error";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  scope?: string;
}

export function rateLimit(req: NextRequest, opts: RateLimitOptions): void {
  const now = Date.now();
  const key = `${opts.scope ?? "global"}:${clientKey(req)}`;
  const b = buckets.get(key);

  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    }
    return;
  }

  if (b.count >= opts.limit) {
    const retryAfter = Math.ceil((b.resetAt - now) / 1000);
    throw TooMany(`Rate limit exceeded`, retryAfter);
  }
  b.count += 1;
}
