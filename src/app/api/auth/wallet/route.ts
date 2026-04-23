import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { withErrors } from "@/lib/api-error";
import { parseJson } from "@/lib/api-validate";
import { walletAuthSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";

export const POST = withErrors(async (req) => {
  rateLimit(req as NextRequest, { limit: 20, windowMs: 60_000, scope: "wallet-auth" });
  const { address } = await parseJson(req, walletAuthSchema);
  const normalized = address.toLowerCase();
  const db = getDb();

  let user = db
    .prepare("SELECT id, address FROM users WHERE address = ?")
    .get(normalized) as { id: string; address: string } | undefined;

  if (!user) {
    const id = uuidv4();
    db.prepare(
      "INSERT INTO users (id, address, auth_provider) VALUES (?, ?, 'siwe')"
    ).run(id, normalized);
    user = { id, address: normalized };
  }

  return NextResponse.json(user);
});
