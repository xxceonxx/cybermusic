import { auth } from "./auth";
import { NextRequest } from "next/server";
import { getDb } from "./db";

/**
 * Get the current user ID from Auth.js session or x-user-id header.
 * The frontend sets x-user-id after wallet registration.
 */
export async function getUserId(req?: NextRequest): Promise<string | null> {
  // First try Auth.js session
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }

  // Fall back to x-user-id header (set by wallet-connected frontend)
  if (req) {
    const headerUserId = req.headers.get("x-user-id");
    if (headerUserId) {
      // Verify user exists in DB
      const db = getDb();
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(headerUserId);
      if (user) return headerUserId;
    }
  }

  return null;
}
