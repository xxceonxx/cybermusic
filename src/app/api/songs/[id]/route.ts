import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb, toCamel, toCamelAll } from "@/lib/db";
import { withErrors, BadRequest, Forbidden, NotFound } from "@/lib/api-error";
import { parseJson } from "@/lib/api-validate";
import { patchSongSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const db = getDb();

  const song = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!song) throw NotFound();

  const tracks = db
    .prepare(
      `SELECT t.*, u.name as editor_name, u.address as editor_address
       FROM tracks t
       LEFT JOIN users u ON t.editor_id = u.id
       WHERE t.song_id = ?
       ORDER BY t.created_at ASC`
    )
    .all(id) as Record<string, unknown>[];

  return NextResponse.json({ ...toCamel(song), tracks: toCamelAll(tracks) });
});

export const DELETE = withErrors<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);

  const db = getDb();
  const song = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as
    | { creator_id: string; status: string }
    | undefined;

  if (!song) throw NotFound();
  if (song.creator_id !== userId) throw Forbidden();
  if (song.status === "minted") throw BadRequest("Cannot delete minted song");

  db.prepare("DELETE FROM tracks WHERE song_id = ?").run(id);
  db.prepare("DELETE FROM songs WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
});

export const PATCH = withErrors<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);

  const db = getDb();
  const song = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as
    | { creator_id: string }
    | undefined;

  if (!song) throw NotFound();
  if (song.creator_id !== userId) throw Forbidden();

  const body = await parseJson(req, patchSongSchema);
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (updates.length === 0) throw BadRequest("No fields to update");

  values.push(id);
  db.prepare(`UPDATE songs SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const updated = db
    .prepare("SELECT * FROM songs WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return NextResponse.json(toCamel(updated));
});
