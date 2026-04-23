import type { NextRequest } from "next/server";
import { TooMany } from "./api-error";

type Bucket = { count: number; resetAt: number };

interface KvNamespace {
  get(key: string, options: { type: "json" }): Promise<Bucket | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

const memoryBuckets = new Map<string, Bucket>();

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

async function getKvBinding(): Promise<KvNamespace | null> {
  try {
    const mod = await import("@cloudflare/next-on-pages");
    const env = mod.getOptionalRequestContext()?.env as
      | { RATE_LIMIT_KV?: KvNamespace }
      | undefined;
    return env?.RATE_LIMIT_KV ?? null;
  } catch {
    return null;
  }
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  scope?: string;
}

function check(bucket: Bucket | null, now: number, opts: RateLimitOptions): Bucket {
  if (!bucket || now >= bucket.resetAt) {
    return { count: 1, resetAt: now + opts.windowMs };
  }
  if (bucket.count >= opts.limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    throw TooMany("Rate limit exceeded", retryAfter);
  }
  return { count: bucket.count + 1, resetAt: bucket.resetAt };
}

export async function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions
): Promise<void> {
  const now = Date.now();
  const key = `rl:${opts.scope ?? "global"}:${clientKey(req)}`;

  const kv = await getKvBinding();
  if (kv) {
    const current = await kv.get(key, { type: "json" });
    const next = check(current, now, opts);
    const ttl = Math.max(60, Math.ceil((next.resetAt - now) / 1000) + 1);
    await kv.put(key, JSON.stringify(next), { expirationTtl: ttl });
    return;
  }

  const next = check(memoryBuckets.get(key) ?? null, now, opts);
  memoryBuckets.set(key, next);
  if (memoryBuckets.size > 5000) {
    for (const [k, v] of memoryBuckets) if (v.resetAt < now) memoryBuckets.delete(k);
  }
}
