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
  const db = await getDb();

  let user = await db.first<{ id: string; address: string }>(
    "SELECT id, address FROM users WHERE address = ?",
    normalized
  );

  if (!user) {
    const id = uuidv4();
    await db.run(
      "INSERT INTO users (id, address, auth_provider) VALUES (?, ?, 'siwe')",
      id,
      normalized
    );
    user = { id, address: normalized };
  }

  return NextResponse.json(user);
});
