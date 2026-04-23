import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb, toCamel } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { withErrors, Conflict, NotFound } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrors<Ctx>(async (req, { params }) => {
  await rateLimit(req as NextRequest, { limit: 30, windowMs: 60_000, scope: "claim" });
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);

  const db = await getDb();

  const claimResult = await db.run(
    "UPDATE tracks SET editor_id = ?, status = 'editing' WHERE id = ? AND status = 'open'",
    userId,
    id
  );

  if (claimResult.changes === 0) {
    const exists = await db.first("SELECT id FROM tracks WHERE id = ?", id);
    if (!exists) throw NotFound();
    throw Conflict("Track not available");
  }

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
      "track_claimed",
      `Someone claimed the ${trackFull.instrument} track on "${song.name}"`,
      trackFull.song_id
    );
  }

  const updated = await db.first("SELECT * FROM tracks WHERE id = ?", id);
  return NextResponse.json(updated ? toCamel(updated) : {});
});
