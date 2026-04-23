import { auth } from "./auth";
import { NextRequest } from "next/server";
import { getDb } from "./db";
import { Unauthorized } from "./api-error";

export async function getUserId(req?: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  if (req) {
    const headerUserId = req.headers.get("x-user-id");
    if (headerUserId) {
      const db = getDb();
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(headerUserId);
      if (user) return headerUserId;
    }
  }
  return null;
}

export async function requireUserId(req?: NextRequest): Promise<string> {
  const id = await getUserId(req);
  if (!id) throw Unauthorized();
  return id;
}
