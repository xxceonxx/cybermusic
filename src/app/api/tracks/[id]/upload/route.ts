import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

// PUT /api/tracks/[id]/upload — Set IPFS URL after upload
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { ipfsUrl } = body;

  if (!ipfsUrl) {
    return NextResponse.json({ error: "Missing ipfsUrl" }, { status: 400 });
  }

  const db = getDb();
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id) as
    | { creator_id: string; editor_id: string | null }
    | undefined;

  if (!track) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = track.creator_id === session.user.id;
  const isEditor = track.editor_id === session.user.id;
  if (!isOwner && !isEditor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  db.prepare(
    "UPDATE tracks SET ipfs_url = ?, status = 'uploaded' WHERE id = ?"
  ).run(ipfsUrl, id);

  const updated = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id);
  return NextResponse.json(updated);
}
