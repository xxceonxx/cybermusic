import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { withErrors, Forbidden, NotFound } from "@/lib/api-error";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withErrors<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const userId = await requireUserId(req as NextRequest);

  const db = await getDb();
  const track = await db.first<{ creator_id: string }>(
    "SELECT * FROM tracks WHERE id = ?",
    id
  );

  if (!track) throw NotFound();
  if (track.creator_id !== userId) throw Forbidden();

  await db.run("DELETE FROM tracks WHERE id = ?", id);
  return NextResponse.json({ success: true });
});
