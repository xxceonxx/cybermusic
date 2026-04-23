import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb, toCamel } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { withErrors, Forbidden, NotFound } from "@/lib/api-error";
import { parseJson } from "@/lib/api-validate";
import { uploadTrackSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrors<Ctx>(async (req, { params }) => {
  rateLimit(req as NextRequest, { limit: 30, windowMs: 60_000, scope: "track:upload" });
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);
  const { ipfsUrl } = await parseJson(req, uploadTrackSchema);

  const db = getDb();
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id) as
    | { creator_id: string; editor_id: string | null }
    | undefined;

  if (!track) throw NotFound();

  const isOwner = track.creator_id === userId;
  const isEditor = track.editor_id === userId;
  if (!isOwner && !isEditor) throw Forbidden();

  db.prepare(
    "UPDATE tracks SET ipfs_url = ?, status = 'uploaded' WHERE id = ?"
  ).run(ipfsUrl, id);

  const trackFull = db
    .prepare("SELECT song_id, instrument FROM tracks WHERE id = ?")
    .get(id) as { song_id: number; instrument: string };
  const song = db
    .prepare("SELECT creator_id, name FROM songs WHERE id = ?")
    .get(trackFull.song_id) as { creator_id: string; name: string };
  if (song.creator_id !== userId) {
    createNotification(
      song.creator_id,
      "track_uploaded",
      `New audio uploaded for ${trackFull.instrument} on "${song.name}"`,
      trackFull.song_id
    );
  }

  const updated = db
    .prepare("SELECT * FROM tracks WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return NextResponse.json(toCamel(updated));
});
