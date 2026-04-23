import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpError } from "./api-error";

const mockAuth = vi.fn();
const mockDbFirst = vi.fn();

vi.mock("./auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    first: (sql: string, ...params: unknown[]) => mockDbFirst(sql, ...params),
    all: vi.fn(),
    run: vi.fn(),
    batch: vi.fn(),
  }),
}));

import { getUserId, requireUserId } from "./api-auth";

function makeReq(headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as Parameters<typeof getUserId>[0];
}

describe("getUserId", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDbFirst.mockReset();
  });

  it("returns session user id when session exists", async () => {
    mockAuth.mockResolvedValue({ user: { id: "session-user-1" } });
    expect(await getUserId()).toBe("session-user-1");
    expect(mockDbFirst).not.toHaveBeenCalled();
  });

  it("falls back to x-user-id header and verifies DB row", async () => {
    mockAuth.mockResolvedValue(null);
    mockDbFirst.mockResolvedValue({ id: "header-user-1" });
    const req = makeReq({ "x-user-id": "header-user-1" });

    expect(await getUserId(req)).toBe("header-user-1");
    expect(mockDbFirst).toHaveBeenCalledWith(
      "SELECT id FROM users WHERE id = ?",
      "header-user-1"
    );
  });

  it("returns null when header user is not in DB", async () => {
    mockAuth.mockResolvedValue(null);
    mockDbFirst.mockResolvedValue(undefined);
    const req = makeReq({ "x-user-id": "ghost-user" });

    expect(await getUserId(req)).toBeNull();
  });

  it("returns null when no session and no header", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await getUserId(makeReq())).toBeNull();
  });

  it("prefers session over header when both present", async () => {
    mockAuth.mockResolvedValue({ user: { id: "session-wins" } });
    const req = makeReq({ "x-user-id": "header-loses" });
    expect(await getUserId(req)).toBe("session-wins");
    expect(mockDbFirst).not.toHaveBeenCalled();
  });
});

describe("requireUserId", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDbFirst.mockReset();
  });

  it("returns id when authenticated", async () => {
    mockAuth.mockResolvedValue({ user: { id: "abc" } });
    expect(await requireUserId()).toBe("abc");
  });

  it("throws 401 HttpError when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    let err: unknown;
    try {
      await requireUserId();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(401);
  });
});
