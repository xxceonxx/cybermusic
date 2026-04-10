import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST /api/songs/[id]/play — increment play count
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  db.prepare("UPDATE songs SET plays = plays + 1 WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
}
