import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb, toCamelAll } from "@/lib/db";
import { withErrors, NotFound } from "@/lib/api-error";
import { parseJson } from "@/lib/api-validate";
import { createCommentSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const db = getDb();

  const comments = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, c.user_id,
              u.name as user_name, u.address as user_address
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.song_id = ?
       ORDER BY c.created_at DESC`
    )
    .all(id) as Record<string, unknown>[];

  return NextResponse.json(toCamelAll(comments));
});

export const POST = withErrors<Ctx>(async (req, { params }) => {
  rateLimit(req as NextRequest, { limit: 10, windowMs: 60_000, scope: "comment" });
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);
  const { body: commentBody } = await parseJson(req, createCommentSchema);

  const db = getDb();
  const song = db.prepare("SELECT id FROM songs WHERE id = ?").get(id);
  if (!song) throw NotFound("Song not found");

  const result = db
    .prepare("INSERT INTO comments (song_id, user_id, body) VALUES (?, ?, ?)")
    .run(id, userId, commentBody);

  const comment = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, c.user_id,
              u.name as user_name, u.address as user_address
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    )
    .get(result.lastInsertRowid) as Record<string, unknown> | undefined;

  return NextResponse.json(comment ? toCamelAll([comment])[0] : {}, { status: 201 });
});
