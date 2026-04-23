import { test, expect } from "@playwright/test";
import { SEED } from "./global-setup";

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/cybermusic/i);
  await expect(page.locator("body")).toBeVisible();
});

test("songs API returns seeded song", async ({ request }) => {
  const res = await request.get("/api/songs");
  expect(res.status()).toBe(200);
  const body = (await res.json()) as Array<{ id: number; name: string }>;
  expect(Array.isArray(body)).toBe(true);
  expect(body.some((s) => s.id === SEED.songId && s.name === SEED.songName)).toBe(true);
});

test("POST /api/songs without auth returns 401", async ({ request }) => {
  const res = await request.post("/api/songs", {
    data: { name: "Test", duration: 60, bpm: 120 },
  });
  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body.error).toBe("Unauthorized");
});

test("POST /api/songs with auth but invalid body returns 400 validation", async ({
  request,
}) => {
  const res = await request.post("/api/songs", {
    headers: { "x-user-id": SEED.userId, "content-type": "application/json" },
    data: { name: "", duration: -1, bpm: 99999 },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toBe("Validation failed");
});

test("POST /api/auth/wallet rejects malformed address", async ({ request }) => {
  const res = await request.post("/api/auth/wallet", {
    data: { address: "not-an-address" },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toBe("Validation failed");
});

test("play endpoint rate-limits rapid requests", async ({ request }) => {
  const codes: number[] = [];
  for (let i = 0; i < 8; i++) {
    const res = await request.post(`/api/songs/${SEED.songId}/play`);
    codes.push(res.status());
  }
  expect(codes).toContain(429);
  expect(codes.filter((c) => c === 200).length).toBe(5);
});

test("track can be claimed exactly once", async ({ request }) => {
  const first = await request.put(`/api/tracks/${SEED.trackId}/claim`, {
    headers: { "x-user-id": SEED.userId },
  });
  expect([200, 409]).toContain(first.status());

  const second = await request.put(`/api/tracks/${SEED.trackId}/claim`, {
    headers: { "x-user-id": SEED.userId },
  });
  expect(second.status()).toBe(409);
});
