import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb, toCamel, toCamelAll } from "@/lib/db";
import { withErrors, NotFound } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrors<Ctx>(async (req, { params }) => {
  rateLimit(req as NextRequest, { limit: 10, windowMs: 60_000, scope: "fork" });
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);

  const db = await getDb();
  const original = await db.first<{
    name: string;
    duration: number;
    bpm: number;
    image: string;
  }>("SELECT * FROM songs WHERE id = ?", id);
  if (!original) throw NotFound("Song not found");

  const result = await db.run(
    "INSERT INTO songs (name, duration, bpm, image, creator_id) VALUES (?, ?, ?, ?, ?)",
    `${original.name} (Remix)`,
    original.duration,
    original.bpm,
    original.image,
    userId
  );

  const newSongId = result.lastInsertId;

  const originalTracks = await db.all<{ instrument: string }>(
    "SELECT instrument FROM tracks WHERE song_id = ?",
    id
  );

  if (originalTracks.length > 0) {
    await db.batch(
      originalTracks.map((t) => ({
        sql: "INSERT INTO tracks (song_id, instrument, creator_id) VALUES (?, ?, ?)",
        params: [newSongId, t.instrument, userId],
      }))
    );
  }

  const song = await db.first("SELECT * FROM songs WHERE id = ?", newSongId);
  const tracks = await db.all(
    "SELECT * FROM tracks WHERE song_id = ?",
    newSongId
  );

  return NextResponse.json(
    { ...(song ? toCamel(song) : {}), tracks: toCamelAll(tracks) },
    { status: 201 }
  );
});
