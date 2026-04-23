import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb, toCamel, toCamelAll } from "@/lib/db";
import { withErrors } from "@/lib/api-error";
import { parseJson, parseQuery } from "@/lib/api-validate";
import { createSongSchema, songsQuerySchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";

const COVER_IMAGES = [
  "https://gateway.pinata.cloud/ipfs/QmTSwYWnnB9LW4bCKqyaAg7vrYhdoLLevzAchQaGg3PPzt",
  "https://gateway.pinata.cloud/ipfs/QmTSmz3MWt2F5Kcz4vktxoepLqRg6kwikvb2fus9wWRE6S",
  "https://gateway.pinata.cloud/ipfs/QmXPCTmUoTPUbW1hN5KFNv8pehjUAVxTZ5TQEHLtHCcTUL",
  "https://gateway.pinata.cloud/ipfs/QmX46PtZorWJrzCk34WSitPW4XK6a1S2Gc6BDDgkj115ok",
  "https://gateway.pinata.cloud/ipfs/QmVXcnCyKQ3vSqgsExfuJcuKwSADZ9s66MxjuvRzSLehYG",
  "https://gateway.pinata.cloud/ipfs/QmUS5ukGNj4kbYH6hnfu6Eg6Q9d6GgsEP2gfkjVCQT856p",
  "https://gateway.pinata.cloud/ipfs/QmNfGsPqVaiKfKZNbY48Epdafp4GERJZHgFkazDE9bNPZG",
];

export const GET = withErrors(async (req) => {
  const { creator } = parseQuery(req as NextRequest, songsQuerySchema);
  const db = await getDb();

  const songs = creator
    ? await db.all("SELECT * FROM songs WHERE creator_id = ? ORDER BY created_at DESC", creator)
    : await db.all("SELECT * FROM songs ORDER BY created_at DESC");

  const withTracks = await Promise.all(
    songs.map(async (song) => {
      const tracks = await db.all(
        "SELECT id, instrument, status, ipfs_url FROM tracks WHERE song_id = ?",
        song.id as number
      );
      return { ...toCamel(song), tracks: toCamelAll(tracks) };
    })
  );

  return NextResponse.json(withTracks);
});

export const POST = withErrors(async (req) => {
  await rateLimit(req as NextRequest, { limit: 30, windowMs: 60_000, scope: "song:create" });
  const userId = await requireUserId(req as NextRequest);
  const { name, duration, bpm, genre } = await parseJson(req, createSongSchema);

  const db = await getDb();
  const image = COVER_IMAGES[Math.floor(Math.random() * COVER_IMAGES.length)];

  const result = await db.run(
    "INSERT INTO songs (name, duration, bpm, image, creator_id, genre) VALUES (?, ?, ?, ?, ?, ?)",
    name,
    duration,
    bpm,
    image,
    userId,
    genre ?? null
  );

  const song = await db.first(
    "SELECT * FROM songs WHERE id = ?",
    result.lastInsertId
  );

  return NextResponse.json(song ? toCamel(song) : {}, { status: 201 });
});
