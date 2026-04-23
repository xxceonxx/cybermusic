import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb, toCamel } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { withErrors, Conflict, NotFound } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrors<Ctx>(async (req, { params }) => {
  rateLimit(req as NextRequest, { limit: 30, windowMs: 60_000, scope: "claim" });
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);

  const db = getDb();

  const claim = db.transaction((trackId: string, uid: string) => {
    const t = db.prepare("SELECT * FROM tracks WHERE id = ?").get(trackId) as
      | { status: string; editor_id: string | null }
      | undefined;
    if (!t) throw NotFound();
    if (t.status !== "open") throw Conflict("Track not available");
    db.prepare(
      "UPDATE tracks SET editor_id = ?, status = 'editing' WHERE id = ?"
    ).run(uid, trackId);
  });
  claim(id, userId);

  const trackFull = db
    .prepare("SELECT song_id, instrument FROM tracks WHERE id = ?")
    .get(id) as { song_id: number; instrument: string };
  const song = db
    .prepare("SELECT creator_id, name FROM songs WHERE id = ?")
    .get(trackFull.song_id) as { creator_id: string; name: string };
  if (song.creator_id !== userId) {
    createNotification(
      song.creator_id,
      "track_claimed",
      `Someone claimed the ${trackFull.instrument} track on "${song.name}"`,
      trackFull.song_id
    );
  }

  const updated = db
    .prepare("SELECT * FROM tracks WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return NextResponse.json(toCamel(updated));
});
