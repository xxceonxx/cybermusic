import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

// GET /api/songs/[id] — Song with tracks
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const song = db.prepare("SELECT * FROM songs WHERE id = ?").get(id);
  if (!song) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tracks = db
    .prepare("SELECT * FROM tracks WHERE song_id = ? ORDER BY created_at ASC")
    .all(id);

  return NextResponse.json({ ...song, tracks });
}

// DELETE /api/songs/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(_req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const song = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as
    | { creator_id: string; status: string }
    | undefined;

  if (!song) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (song.creator_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (song.status === "minted") {
    return NextResponse.json({ error: "Cannot delete minted song" }, { status: 400 });
  }

  db.prepare("DELETE FROM tracks WHERE song_id = ?").run(id);
  db.prepare("DELETE FROM songs WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
}

// PATCH /api/songs/[id] — Update song status/urls
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const song = db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as
    | { creator_id: string }
    | undefined;

  if (!song) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (song.creator_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["status", "ipfs_url", "meta_url", "name"];
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);
  db.prepare(`UPDATE songs SET ${updates.join(", ")} WHERE id = ?`).run(
    ...values
  );

  const updated = db.prepare("SELECT * FROM songs WHERE id = ?").get(id);
  return NextResponse.json(updated);
}
