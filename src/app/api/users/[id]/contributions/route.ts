import { NextResponse } from "next/server";
import { getDb, toCamel, toCamelAll } from "@/lib/db";
import { withErrors } from "@/lib/api-error";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const db = await getDb();

  const songs = await db.all(
    `SELECT DISTINCT s.*
     FROM songs s
     INNER JOIN tracks t ON t.song_id = s.id
     WHERE t.editor_id = ? AND t.creator_id != ?
     ORDER BY s.created_at DESC`,
    id,
    id
  );

  const result = await Promise.all(
    songs.map(async (song) => {
      const tracks = await db.all(
        "SELECT id, instrument, status, ipfs_url FROM tracks WHERE song_id = ?",
        song.id as number
      );
      return { ...toCamel(song), tracks: toCamelAll(tracks) };
    })
  );

  return NextResponse.json(result);
});
