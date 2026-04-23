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

  const db = getDb();
  const original = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!original) throw NotFound("Song not found");

  const result = db
    .prepare(
      "INSERT INTO songs (name, duration, bpm, image, creator_id) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      `${original.name} (Remix)`,
      original.duration,
      original.bpm,
      original.image,
      userId
    );

  const newSongId = result.lastInsertRowid;

  const originalTracks = db
    .prepare("SELECT instrument FROM tracks WHERE song_id = ?")
    .all(id) as { instrument: string }[];

  const insertTrack = db.prepare(
    "INSERT INTO tracks (song_id, instrument, creator_id) VALUES (?, ?, ?)"
  );
  const tx = db.transaction((items: { instrument: string }[]) => {
    for (const t of items) insertTrack.run(newSongId, t.instrument, userId);
  });
  tx(originalTracks);

  const song = db
    .prepare("SELECT * FROM songs WHERE id = ?")
    .get(newSongId) as Record<string, unknown>;
  const tracks = db
    .prepare("SELECT * FROM tracks WHERE song_id = ?")
    .all(newSongId as number) as Record<string, unknown>[];

  return NextResponse.json(
    { ...toCamel(song), tracks: toCamelAll(tracks) },
    { status: 201 }
  );
});
