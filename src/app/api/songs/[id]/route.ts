import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb, toCamel, toCamelAll } from "@/lib/db";
import { withErrors, BadRequest, Forbidden, NotFound } from "@/lib/api-error";
import { parseJson } from "@/lib/api-validate";
import { patchSongSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const db = await getDb();

  const song = await db.first("SELECT * FROM songs WHERE id = ?", id);
  if (!song) throw NotFound();

  const tracks = await db.all(
    `SELECT t.*, u.name as editor_name, u.address as editor_address
     FROM tracks t
     LEFT JOIN users u ON t.editor_id = u.id
     WHERE t.song_id = ?
     ORDER BY t.created_at ASC`,
    id
  );

  return NextResponse.json({ ...toCamel(song), tracks: toCamelAll(tracks) });
});

export const DELETE = withErrors<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);

  const db = await getDb();
  const song = await db.first<{ creator_id: string; status: string }>(
    "SELECT * FROM songs WHERE id = ?",
    id
  );

  if (!song) throw NotFound();
  if (song.creator_id !== userId) throw Forbidden();
  if (song.status === "minted") throw BadRequest("Cannot delete minted song");

  await db.batch([
    { sql: "DELETE FROM tracks WHERE song_id = ?", params: [id] },
    { sql: "DELETE FROM songs WHERE id = ?", params: [id] },
  ]);

  return NextResponse.json({ success: true });
});

export const PATCH = withErrors<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);

  const db = await getDb();
  const song = await db.first<{ creator_id: string }>(
    "SELECT * FROM songs WHERE id = ?",
    id
  );

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
  await db.run(`UPDATE songs SET ${updates.join(", ")} WHERE id = ?`, ...values);

  const updated = await db.first("SELECT * FROM songs WHERE id = ?", id);
  return NextResponse.json(updated ? toCamel(updated) : {});
});
