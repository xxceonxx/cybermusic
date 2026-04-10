import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getDb, toCamel } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// PUT /api/tracks/[id]/upload — Set IPFS URL after upload
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { ipfsUrl } = body;

  if (!ipfsUrl) {
    return NextResponse.json({ error: "Missing ipfsUrl" }, { status: 400 });
  }

  const db = getDb();
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id) as
    | { creator_id: string; editor_id: string | null }
    | undefined;

  if (!track) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = track.creator_id === userId;
  const isEditor = track.editor_id === userId;
  if (!isOwner && !isEditor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  db.prepare(
    "UPDATE tracks SET ipfs_url = ?, status = 'uploaded' WHERE id = ?"
  ).run(ipfsUrl, id);

  // Notify song creator about new audio
  const trackFull = db.prepare("SELECT song_id, instrument FROM tracks WHERE id = ?").get(id) as { song_id: number; instrument: string };
  const song = db.prepare("SELECT creator_id, name FROM songs WHERE id = ?").get(trackFull.song_id) as { creator_id: string; name: string };
  if (song.creator_id !== userId) {
    createNotification(song.creator_id, "track_uploaded", `New audio uploaded for ${trackFull.instrument} on "${song.name}"`, trackFull.song_id);
  }

  const updated = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id) as Record<string, unknown>;
  return NextResponse.json(toCamel(updated));
}
