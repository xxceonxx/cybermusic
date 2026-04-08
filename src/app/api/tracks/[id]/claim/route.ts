import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

// PUT /api/tracks/[id]/claim — Claim a track (slot machine)
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id) as
    | { status: string; editor_id: string | null }
    | undefined;

  if (!track) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (track.status !== "open") {
    return NextResponse.json({ error: "Track not available" }, { status: 409 });
  }

  db.prepare(
    "UPDATE tracks SET editor_id = ?, status = 'editing' WHERE id = ?"
  ).run(session.user.id, id);

  const updated = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id);
  return NextResponse.json(updated);
}
