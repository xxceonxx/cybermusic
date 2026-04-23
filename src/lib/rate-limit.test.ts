import { describe, it, expect, vi } from "vitest";
import { rateLimit } from "./rate-limit";
import { HttpError } from "./api-error";

function makeReq(ip: string): Parameters<typeof rateLimit>[0] {
  return {
    headers: new Headers({ "x-forwarded-for": ip }),
  } as unknown as Parameters<typeof rateLimit>[0];
}

describe("rateLimit (in-memory fallback)", () => {
  it("allows up to limit within window", async () => {
    const req = makeReq("10.0.0.1");
    for (let i = 0; i < 3; i++) {
      await expect(
        rateLimit(req, { limit: 3, windowMs: 1000, scope: "test-ok" })
      ).resolves.toBeUndefined();
    }
  });

  it("throws 429 when limit exceeded", async () => {
    const req = makeReq("10.0.0.2");
    for (let i = 0; i < 3; i++) {
      await rateLimit(req, { limit: 3, windowMs: 10_000, scope: "test-over" });
    }
    let err: unknown;
    try {
      await rateLimit(req, { limit: 3, windowMs: 10_000, scope: "test-over" });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(429);
  });

  it("resets after window elapses", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const req = makeReq("10.0.0.3");
    await rateLimit(req, { limit: 1, windowMs: 500, scope: "test-reset" });
    await expect(
      rateLimit(req, { limit: 1, windowMs: 500, scope: "test-reset" })
    ).rejects.toBeInstanceOf(HttpError);

    vi.advanceTimersByTime(600);
    await expect(
      rateLimit(req, { limit: 1, windowMs: 500, scope: "test-reset" })
    ).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it("isolates different IPs", async () => {
    const reqA = makeReq("10.0.0.4");
    const reqB = makeReq("10.0.0.5");
    await rateLimit(reqA, { limit: 1, windowMs: 10_000, scope: "test-ips" });
    await expect(
      rateLimit(reqB, { limit: 1, windowMs: 10_000, scope: "test-ips" })
    ).resolves.toBeUndefined();
  });

  it("isolates different scopes", async () => {
    const req = makeReq("10.0.0.6");
    await rateLimit(req, { limit: 1, windowMs: 10_000, scope: "scope-a" });
    await expect(
      rateLimit(req, { limit: 1, windowMs: 10_000, scope: "scope-b" })
    ).resolves.toBeUndefined();
  });
});
