import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import {
  withErrors,
  HttpError,
  BadRequest,
  NotFound,
  Forbidden,
  Unauthorized,
  Conflict,
  TooMany,
} from "./api-error";

describe("HttpError helpers", () => {
  it("creates correct statuses", () => {
    expect(BadRequest().status).toBe(400);
    expect(Unauthorized().status).toBe(401);
    expect(Forbidden().status).toBe(403);
    expect(NotFound().status).toBe(404);
    expect(Conflict().status).toBe(409);
    expect(TooMany().status).toBe(429);
  });
});

describe("withErrors", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errSpy.mockRestore());

  it("passes through successful response", async () => {
    const handler = withErrors(async () => new Response("ok", { status: 200 }));
    const res = await handler(new Request("http://x"), {});
    expect(res.status).toBe(200);
  });

  it("converts HttpError to JSON response", async () => {
    const handler = withErrors(async () => {
      throw NotFound("Song not found");
    });
    const res = await handler(new Request("http://x"), {});
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Song not found" });
  });

  it("emits Retry-After header on TooMany", async () => {
    const handler = withErrors(async () => {
      throw new HttpError(429, "slow down", { retryAfter: 42 });
    });
    const res = await handler(new Request("http://x"), {});
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
  });

  it("converts ZodError to 400 with issues", async () => {
    const schema = z.object({ name: z.string().min(1) });
    const handler = withErrors(async () => {
      schema.parse({ name: "" });
      return new Response("unreachable");
    });
    const res = await handler(new Request("http://x"), {});
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; details: unknown };
    expect(body.error).toBe("Validation failed");
    expect(Array.isArray(body.details)).toBe(true);
  });

  it("converts JSON SyntaxError to 400", async () => {
    const handler = withErrors(async (req) => {
      await req.json();
      return new Response("unreachable");
    });
    const res = await handler(
      new Request("http://x", { method: "POST", body: "{not json" }),
      {}
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 for unknown errors and logs them", async () => {
    const handler = withErrors(async () => {
      throw new Error("boom");
    });
    const res = await handler(new Request("http://x"), {});
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
    expect(errSpy).toHaveBeenCalled();
  });
});
