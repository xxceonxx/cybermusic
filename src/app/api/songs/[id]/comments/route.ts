import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getDb, toCamelAll } from "@/lib/db";

// GET /api/songs/[id]/comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const comments = db
    .prepare(`
      SELECT c.id, c.body, c.created_at, c.user_id,
             u.name as user_name, u.address as user_address
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.song_id = ?
      ORDER BY c.created_at DESC
    `)
    .all(id) as Record<string, unknown>[];

  return NextResponse.json(toCamelAll(comments));
}

// POST /api/songs/[id]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { body: commentBody } = body;

  if (!commentBody || !commentBody.trim()) {
    return NextResponse.json({ error: "Empty comment" }, { status: 400 });
  }

  const db = getDb();

  // Verify song exists
  const song = db.prepare("SELECT id FROM songs WHERE id = ?").get(id);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const result = db
    .prepare("INSERT INTO comments (song_id, user_id, body) VALUES (?, ?, ?)")
    .run(id, userId, commentBody.trim());

  const comment = db
    .prepare(`
      SELECT c.id, c.body, c.created_at, c.user_id,
             u.name as user_name, u.address as user_address
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `)
    .get(result.lastInsertRowid) as Record<string, unknown>;

  return NextResponse.json(comment ? toCamelAll([comment])[0] : {}, { status: 201 });
}
