import { NextRequest, NextResponse } from "next/server";
import { getDb, toCamel, toCamelAll } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  // Songs where this user has contributed a track (as editor)
  const songs = db
    .prepare(`
      SELECT DISTINCT s.*
      FROM songs s
      INNER JOIN tracks t ON t.song_id = s.id
      WHERE t.editor_id = ? AND t.creator_id != ?
      ORDER BY s.created_at DESC
    `)
    .all(id, id) as Record<string, unknown>[];

  const result = songs.map((song) => {
    const tracks = db
      .prepare("SELECT id, instrument, status, ipfs_url FROM tracks WHERE song_id = ?")
      .all(song.id as number) as Record<string, unknown>[];
    return { ...toCamel(song), tracks: toCamelAll(tracks) };
  });

  return NextResponse.json(result);
}
