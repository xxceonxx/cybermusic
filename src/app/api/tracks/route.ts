import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb, toCamel, toCamelAll } from "@/lib/db";
import { withErrors } from "@/lib/api-error";
import { parseJson, parseQuery } from "@/lib/api-validate";
import { createTrackSchema, tracksQuerySchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";

export const GET = withErrors(async (req) => {
  const { status, instrument } = parseQuery(req as NextRequest, tracksQuerySchema);
  const db = getDb();

  let query = "SELECT * FROM tracks WHERE 1=1";
  const params: unknown[] = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (instrument && instrument.length > 0) {
    query += ` AND instrument IN (${instrument.map(() => "?").join(",")})`;
    params.push(...instrument);
  }

  query += " ORDER BY created_at DESC";
  const tracks = db.prepare(query).all(...params) as Record<string, unknown>[];
  return NextResponse.json(toCamelAll(tracks));
});

export const POST = withErrors(async (req) => {
  rateLimit(req as NextRequest, { limit: 60, windowMs: 60_000, scope: "track:create" });
  const userId = await requireUserId(req as NextRequest);
  const { songId, instrument } = await parseJson(req, createTrackSchema);

  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO tracks (song_id, instrument, creator_id) VALUES (?, ?, ?)"
    )
    .run(songId, instrument, userId);

  const track = db
    .prepare("SELECT * FROM tracks WHERE id = ?")
    .get(result.lastInsertRowid) as Record<string, unknown>;

  return NextResponse.json(toCamel(track), { status: 201 });
});
