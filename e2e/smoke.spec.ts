import { test, expect } from "@playwright/test";

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/cybermusic/i);
  await expect(page.locator("body")).toBeVisible();
});

test("songs API returns JSON array", async ({ request }) => {
  const res = await request.get("/api/songs");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
});

test("POST /api/songs without auth returns 401", async ({ request }) => {
  const res = await request.post("/api/songs", {
    data: { name: "Test", duration: 60, bpm: 120 },
  });
  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body.error).toBe("Unauthorized");
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
  const songs = await (await request.get("/api/songs")).json();
  if (!songs.length) test.skip(true, "No songs in DB to test against");
  const songId = songs[0].id;

  const codes: number[] = [];
  for (let i = 0; i < 8; i++) {
    const res = await request.post(`/api/songs/${songId}/play`);
    codes.push(res.status());
  }
  expect(codes).toContain(429);
});
