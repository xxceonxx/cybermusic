import { test, expect, type APIRequestContext } from "@playwright/test";
import { SEED } from "./global-setup";

const AUTH = { "x-user-id": SEED.userId, "content-type": "application/json" };

async function createSong(request: APIRequestContext, name: string) {
  const res = await request.post("/api/songs", {
    headers: AUTH,
    data: { name, duration: 120, bpm: 120 },
  });
  expect(res.status()).toBe(201);
  return (await res.json()) as { id: number; name: string };
}

async function createTrack(
  request: APIRequestContext,
  songId: number,
  instrument = "Bass"
) {
  const res = await request.post("/api/tracks", {
    headers: AUTH,
    data: { songId, instrument },
  });
  expect(res.status()).toBe(201);
  return (await res.json()) as { id: number; instrument: string; status: string };
}

test.describe("Comments flow", () => {
  test("posts and retrieves a comment", async ({ request }) => {
    const song = await createSong(request, "Comment flow song");

    const post = await request.post(`/api/songs/${song.id}/comments`, {
      headers: AUTH,
      data: { body: "First comment here" },
    });
    expect(post.status()).toBe(201);
    const created = (await post.json()) as { body: string; userId: string };
    expect(created.body).toBe("First comment here");
    expect(created.userId).toBe(SEED.userId);

    const list = await request.get(`/api/songs/${song.id}/comments`);
    expect(list.status()).toBe(200);
    const comments = (await list.json()) as Array<{ body: string }>;
    expect(comments.some((c) => c.body === "First comment here")).toBe(true);
  });

  test("rejects empty comment body", async ({ request }) => {
    const song = await createSong(request, "Comment reject song");
    const res = await request.post(`/api/songs/${song.id}/comments`, {
      headers: AUTH,
      data: { body: "   " },
    });
    expect(res.status()).toBe(400);
  });

  test("returns 404 for comment on non-existent song", async ({ request }) => {
    const res = await request.post("/api/songs/88888888/comments", {
      headers: AUTH,
      data: { body: "ghost" },
    });
    expect(res.status()).toBe(404);
  });
});

test.describe("Track upload", () => {
  test("owner can set ipfsUrl and status flips to uploaded", async ({ request }) => {
    const song = await createSong(request, "Upload flow song");
    const track = await createTrack(request, song.id, "Drums");
    expect(track.status).toBe("open");

    const ipfsUrl = "https://gateway.pinata.cloud/ipfs/QmUploadFlowTest";
    const res = await request.put(`/api/tracks/${track.id}/upload`, {
      headers: AUTH,
      data: { ipfsUrl },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; ipfsUrl: string };
    expect(body.status).toBe("uploaded");
    expect(body.ipfsUrl).toBe(ipfsUrl);
  });

  test("rejects non-IPFS URL via schema", async ({ request }) => {
    const song = await createSong(request, "Upload reject song");
    const track = await createTrack(request, song.id, "Piano");

    const res = await request.put(`/api/tracks/${track.id}/upload`, {
      headers: AUTH,
      data: { ipfsUrl: "https://example.com/song.mp3" },
    });
    expect(res.status()).toBe(400);
  });

  test("rejects upload from unauthorized user", async ({ request }) => {
    const song = await createSong(request, "Upload forbidden song");
    const track = await createTrack(request, song.id, "Violine");

    const otherUser = "e2e-other-0000-0000-0000-000000000099";
    const res = await request.put(`/api/tracks/${track.id}/upload`, {
      headers: { "x-user-id": otherUser, "content-type": "application/json" },
      data: { ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmForbidden" },
    });
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("Fork flow", () => {
  test("fork copies instrument slots and marks new owner", async ({ request }) => {
    const song = await createSong(request, "Original song");
    await createTrack(request, song.id, "Bass");
    await createTrack(request, song.id, "Drums");

    const forkRes = await request.post(`/api/songs/${song.id}/fork`, {
      headers: AUTH,
    });
    expect(forkRes.status()).toBe(201);
    const fork = (await forkRes.json()) as {
      id: number;
      name: string;
      creatorId: string;
      tracks: Array<{ instrument: string; status: string; ipfsUrl: string | null }>;
    };

    expect(fork.id).not.toBe(song.id);
    expect(fork.name).toContain("(Remix)");
    expect(fork.creatorId).toBe(SEED.userId);
    expect(fork.tracks.map((t) => t.instrument).sort()).toEqual(["Bass", "Drums"]);
    for (const t of fork.tracks) {
      expect(t.status).toBe("open");
      expect(t.ipfsUrl).toBeNull();
    }
  });

  test("fork of missing song returns 404", async ({ request }) => {
    const res = await request.post("/api/songs/77777777/fork", { headers: AUTH });
    expect(res.status()).toBe(404);
  });
});

test.describe("Track delete", () => {
  test("creator can delete own track", async ({ request }) => {
    const song = await createSong(request, "Delete flow song");
    const track = await createTrack(request, song.id, "Flute");

    const del = await request.delete(`/api/tracks/${track.id}`, { headers: AUTH });
    expect(del.status()).toBe(200);

    const songAfter = await (await request.get(`/api/songs/${song.id}`)).json();
    const ids = (songAfter.tracks as Array<{ id: number }>).map((t) => t.id);
    expect(ids).not.toContain(track.id);
  });

  test("non-creator cannot delete track", async ({ request }) => {
    const song = await createSong(request, "Delete forbidden song");
    const track = await createTrack(request, song.id, "Saxophone");

    const other = "e2e-intruder-0000-0000-0000-000000000050";
    const del = await request.delete(`/api/tracks/${track.id}`, {
      headers: { "x-user-id": other },
    });
    expect([401, 403]).toContain(del.status());
  });
});

test.describe("Song delete", () => {
  test("creator deletes song and nested tracks", async ({ request }) => {
    const song = await createSong(request, "Song delete flow");
    await createTrack(request, song.id, "Harp");

    const del = await request.delete(`/api/songs/${song.id}`, { headers: AUTH });
    expect(del.status()).toBe(200);

    const get = await request.get(`/api/songs/${song.id}`);
    expect(get.status()).toBe(404);
  });

  test("cannot delete minted song", async ({ request }) => {
    const song = await createSong(request, "Minted protection song");

    const patch = await request.patch(`/api/songs/${song.id}`, {
      headers: AUTH,
      data: { status: "minted" },
    });
    expect(patch.status()).toBe(200);

    const del = await request.delete(`/api/songs/${song.id}`, { headers: AUTH });
    expect(del.status()).toBe(400);
  });
});
