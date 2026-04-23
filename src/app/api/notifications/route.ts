import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getDb, toCamelAll } from "@/lib/db";
import { withErrors } from "@/lib/api-error";

export const GET = withErrors(async (req) => {
  const userId = await requireUserId(req as NextRequest);
  const db = await getDb();
  const notifications = await db.all(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    userId
  );
  return NextResponse.json(toCamelAll(notifications));
});

export const PATCH = withErrors(async (req) => {
  const userId = await requireUserId(req as NextRequest);
  const db = await getDb();
  await db.run(
    "UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0",
    userId
  );
  return NextResponse.json({ success: true });
});
