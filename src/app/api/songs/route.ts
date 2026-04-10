import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getDb, toCamel, toCamelAll } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const COVER_IMAGES = [
  "https://gateway.pinata.cloud/ipfs/QmTSwYWnnB9LW4bCKqyaAg7vrYhdoLLevzAchQaGg3PPzt",
  "https://gateway.pinata.cloud/ipfs/QmTSmz3MWt2F5Kcz4vktxoepLqRg6kwikvb2fus9wWRE6S",
  "https://gateway.pinata.cloud/ipfs/QmXPCTmUoTPUbW1hN5KFNv8pehjUAVxTZ5TQEHLtHCcTUL",
  "https://gateway.pinata.cloud/ipfs/QmX46PtZorWJrzCk34WSitPW4XK6a1S2Gc6BDDgkj115ok",
  "https://gateway.pinata.cloud/ipfs/QmVXcnCyKQ3vSqgsExfuJcuKwSADZ9s66MxjuvRzSLehYG",
  "https://gateway.pinata.cloud/ipfs/QmUS5ukGNj4kbYH6hnfu6Eg6Q9d6GgsEP2gfkjVCQT856p",
  "https://gateway.pinata.cloud/ipfs/QmNfGsPqVaiKfKZNbY48Epdafp4GERJZHgFkazDE9bNPZG",
];

// GET /api/songs?creator=userId
export async function GET(req: NextRequest) {
  const db = getDb();
  const creatorId = req.nextUrl.searchParams.get("creator");

  const query = creatorId
    ? "SELECT * FROM songs WHERE creator_id = ? ORDER BY created_at DESC"
    : "SELECT * FROM songs ORDER BY created_at DESC";
  const params = creatorId ? [creatorId] : [];

  const songs = db.prepare(query).all(...params) as Record<string, unknown>[];

  // Attach track counts for each song
  const songsWithTracks = songs.map((song) => {
    const tracks = db
      .prepare("SELECT id, instrument, status, ipfs_url FROM tracks WHERE song_id = ?")
      .all(song.id as number) as Record<string, unknown>[];
    return { ...toCamel(song), tracks: toCamelAll(tracks) };
  });

  return NextResponse.json(songsWithTracks);
}

// POST /api/songs
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, duration, bpm, genre } = body;

  if (!name || !duration || !bpm) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  const image = COVER_IMAGES[Math.floor(Math.random() * COVER_IMAGES.length)];

  const result = db
    .prepare(
      "INSERT INTO songs (name, duration, bpm, image, creator_id, genre) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(name, duration, bpm, image, userId, genre || null);

  const song = db
    .prepare("SELECT * FROM songs WHERE id = ?")
    .get(result.lastInsertRowid) as Record<string, unknown>;

  return NextResponse.json(toCamel(song), { status: 201 });
}
