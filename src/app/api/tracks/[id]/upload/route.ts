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
  await rateLimit(req as NextRequest, { limit: 30, windowMs: 60_000, scope: "track:upload" });
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);
  const { ipfsUrl } = await parseJson(req, uploadTrackSchema);

  const db = await getDb();
  const track = await db.first<{ creator_id: string; editor_id: string | null }>(
    "SELECT * FROM tracks WHERE id = ?",
    id
  );

  if (!track) throw NotFound();

  const isOwner = track.creator_id === userId;
  const isEditor = track.editor_id === userId;
  if (!isOwner && !isEditor) throw Forbidden();

  await db.run(
    "UPDATE tracks SET ipfs_url = ?, status = 'uploaded' WHERE id = ?",
    ipfsUrl,
    id
  );

  const trackFull = await db.first<{ song_id: number; instrument: string }>(
    "SELECT song_id, instrument FROM tracks WHERE id = ?",
    id
  );
  const song = trackFull
    ? await db.first<{ creator_id: string; name: string }>(
        "SELECT creator_id, name FROM songs WHERE id = ?",
        trackFull.song_id
      )
    : null;

  if (trackFull && song && song.creator_id !== userId) {
    await createNotification(
      song.creator_id,
      "track_uploaded",
      `New audio uploaded for ${trackFull.instrument} on "${song.name}"`,
      trackFull.song_id
    );
  }

  const updated = await db.first("SELECT * FROM tracks WHERE id = ?", id);
  return NextResponse.json(updated ? toCamel(updated) : {});
});
