import { describe, it, expect, vi } from "vitest";
import { rateLimit } from "./rate-limit";
import { HttpError } from "./api-error";

function makeReq(ip = "1.2.3.4"): Parameters<typeof rateLimit>[0] {
  return {
    headers: new Headers({ "x-forwarded-for": ip }),
  } as unknown as Parameters<typeof rateLimit>[0];
}

describe("rateLimit", () => {
  it("allows up to limit within window", () => {
    const req = makeReq("10.0.0.1");
    for (let i = 0; i < 3; i++) {
      expect(() =>
        rateLimit(req, { limit: 3, windowMs: 1000, scope: "test-ok" })
      ).not.toThrow();
    }
  });

  it("throws 429 when limit exceeded", () => {
    const req = makeReq("10.0.0.2");
    for (let i = 0; i < 3; i++) {
      rateLimit(req, { limit: 3, windowMs: 10_000, scope: "test-over" });
    }
    let err: unknown;
    try {
      rateLimit(req, { limit: 3, windowMs: 10_000, scope: "test-over" });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(429);
  });

  it("resets after window elapses", () => {
    vi.useFakeTimers();
    const req = makeReq("10.0.0.3");
    rateLimit(req, { limit: 1, windowMs: 500, scope: "test-reset" });
    expect(() =>
      rateLimit(req, { limit: 1, windowMs: 500, scope: "test-reset" })
    ).toThrow();

    vi.advanceTimersByTime(600);
    expect(() =>
      rateLimit(req, { limit: 1, windowMs: 500, scope: "test-reset" })
    ).not.toThrow();
    vi.useRealTimers();
  });

  it("isolates different IPs", () => {
    const reqA = makeReq("10.0.0.4");
    const reqB = makeReq("10.0.0.5");
    rateLimit(reqA, { limit: 1, windowMs: 10_000, scope: "test-ips" });
    expect(() =>
      rateLimit(reqB, { limit: 1, windowMs: 10_000, scope: "test-ips" })
    ).not.toThrow();
  });

  it("isolates different scopes", () => {
    const req = makeReq("10.0.0.6");
    rateLimit(req, { limit: 1, windowMs: 10_000, scope: "scope-a" });
    expect(() =>
      rateLimit(req, { limit: 1, windowMs: 10_000, scope: "scope-b" })
    ).not.toThrow();
  });
});
