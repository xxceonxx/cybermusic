import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getDb, toCamel } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// PUT /api/tracks/[id]/claim — Claim a track (slot machine)
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(_req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id) as
    | { status: string; editor_id: string | null }
    | undefined;

  if (!track) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (track.status !== "open") {
    return NextResponse.json({ error: "Track not available" }, { status: 409 });
  }

  db.prepare(
    "UPDATE tracks SET editor_id = ?, status = 'editing' WHERE id = ?"
  ).run(userId, id);

  // Notify song creator
  const trackFull = db.prepare("SELECT song_id, instrument FROM tracks WHERE id = ?").get(id) as { song_id: number; instrument: string };
  const song = db.prepare("SELECT creator_id, name FROM songs WHERE id = ?").get(trackFull.song_id) as { creator_id: string; name: string };
  if (song.creator_id !== userId) {
    createNotification(song.creator_id, "track_claimed", `Someone claimed the ${trackFull.instrument} track on "${song.name}"`, trackFull.song_id);
  }

  const updated = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id) as Record<string, unknown>;
  return NextResponse.json(toCamel(updated));
}
