import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getDb, toCamel, toCamelAll } from "@/lib/db";

// POST /api/songs/[id]/fork — Create a remix/fork of a song
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const original = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!original) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  // Create forked song
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

  // Copy track slots (without audio — empty tracks for the new creator)
  const originalTracks = db
    .prepare("SELECT instrument FROM tracks WHERE song_id = ?")
    .all(id) as { instrument: string }[];

  for (const t of originalTracks) {
    db.prepare(
      "INSERT INTO tracks (song_id, instrument, creator_id) VALUES (?, ?, ?)"
    ).run(newSongId, t.instrument, userId);
  }

  const song = db.prepare("SELECT * FROM songs WHERE id = ?").get(newSongId) as Record<string, unknown>;
  const tracks = db.prepare("SELECT * FROM tracks WHERE song_id = ?").all(newSongId as number) as Record<string, unknown>[];

  return NextResponse.json({ ...toCamel(song), tracks: toCamelAll(tracks) }, { status: 201 });
}
