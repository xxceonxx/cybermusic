import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// POST /api/auth/wallet — Register/login wallet user, returns userId
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address } = body;

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

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
}
