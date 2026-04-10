import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getDb, toCamelAll } from "@/lib/db";

// GET /api/notifications — list user's notifications
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const notifications = db
    .prepare(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
    )
    .all(userId) as Record<string, unknown>[];

  return NextResponse.json(toCamelAll(notifications));
}

// PATCH /api/notifications — mark all as read
export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0").run(
    userId
  );

  return NextResponse.json({ success: true });
}
