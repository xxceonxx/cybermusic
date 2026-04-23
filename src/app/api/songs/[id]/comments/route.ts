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
  const db = await getDb();

  const comments = await db.all(
    `SELECT c.id, c.body, c.created_at, c.user_id,
            u.name as user_name, u.address as user_address
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.song_id = ?
     ORDER BY c.created_at DESC`,
    id
  );

  return NextResponse.json(toCamelAll(comments));
});

export const POST = withErrors<Ctx>(async (req, { params }) => {
  await rateLimit(req as NextRequest, { limit: 10, windowMs: 60_000, scope: "comment" });
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);
  const { body: commentBody } = await parseJson(req, createCommentSchema);

  const db = await getDb();
  const song = await db.first("SELECT id FROM songs WHERE id = ?", id);
  if (!song) throw NotFound("Song not found");

  const result = await db.run(
    "INSERT INTO comments (song_id, user_id, body) VALUES (?, ?, ?)",
    id,
    userId,
    commentBody
  );

  const comment = await db.first(
    `SELECT c.id, c.body, c.created_at, c.user_id,
            u.name as user_name, u.address as user_address
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`,
    result.lastInsertId
  );

  return NextResponse.json(comment ? toCamelAll([comment])[0] : {}, { status: 201 });
});
