import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

// DELETE /api/tracks/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(_req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id) as
    | { creator_id: string }
    | undefined;

  if (!track) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (track.creator_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  db.prepare("DELETE FROM tracks WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
