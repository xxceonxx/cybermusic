import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withErrors } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrors<Ctx>(async (req, { params }) => {
  rateLimit(req as NextRequest, { limit: 5, windowMs: 60_000, scope: "play" });
  const { id } = await params;
  const db = getDb();
  db.prepare("UPDATE songs SET plays = plays + 1 WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
});
