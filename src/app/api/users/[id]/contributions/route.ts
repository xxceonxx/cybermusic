import { NextResponse } from "next/server";
import { getDb, toCamel, toCamelAll } from "@/lib/db";
import { withErrors } from "@/lib/api-error";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const db = getDb();

  const songs = db
    .prepare(
      `SELECT DISTINCT s.*
       FROM songs s
       INNER JOIN tracks t ON t.song_id = s.id
       WHERE t.editor_id = ? AND t.creator_id != ?
       ORDER BY s.created_at DESC`
    )
    .all(id, id) as Record<string, unknown>[];

  const result = songs.map((song) => {
    const tracks = db
      .prepare(
        "SELECT id, instrument, status, ipfs_url FROM tracks WHERE song_id = ?"
      )
      .all(song.id as number) as Record<string, unknown>[];
    return { ...toCamel(song), tracks: toCamelAll(tracks) };
  });

  return NextResponse.json(result);
});
