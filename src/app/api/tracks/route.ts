import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

// GET /api/tracks?status=open&instrument=Bass,Drums
export async function GET(req: NextRequest) {
  const db = getDb();
  const status = req.nextUrl.searchParams.get("status");
  const instruments = req.nextUrl.searchParams.get("instrument");

  let query = "SELECT * FROM tracks WHERE 1=1";
  const params: unknown[] = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (instruments) {
    const list = instruments.split(",");
    query += ` AND instrument IN (${list.map(() => "?").join(",")})`;
    params.push(...list);
  }

  query += " ORDER BY created_at DESC";
  const tracks = db.prepare(query).all(...params);
  return NextResponse.json(tracks);
}

// POST /api/tracks
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { songId, instrument } = body;

  if (!songId || !instrument) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO tracks (song_id, instrument, creator_id) VALUES (?, ?, ?)"
    )
    .run(songId, instrument, session.user.id);

  const track = db
    .prepare("SELECT * FROM tracks WHERE id = ?")
    .get(result.lastInsertRowid);

  return NextResponse.json(track, { status: 201 });
}
