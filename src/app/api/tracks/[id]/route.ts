import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { withErrors, Forbidden, NotFound } from "@/lib/api-error";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withErrors<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);

  const db = getDb();
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(id) as
    | { creator_id: string }
    | undefined;

  if (!track) throw NotFound();
  if (track.creator_id !== userId) throw Forbidden();

  db.prepare("DELETE FROM tracks WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
});
