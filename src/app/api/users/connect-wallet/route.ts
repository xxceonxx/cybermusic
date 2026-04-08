import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

// PUT /api/users/connect-wallet — Link wallet to existing account
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { address } = body;

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const normalizedAddress = address.toLowerCase();
  const db = getDb();

  // Check if wallet is already linked to another account
  const existing = db
    .prepare("SELECT id FROM users WHERE address = ?")
    .get(normalizedAddress) as { id: string } | undefined;

  if (existing && existing.id !== session.user.id) {
    return NextResponse.json(
      { error: "Wallet already linked to another account" },
      { status: 409 }
    );
  }

  db.prepare("UPDATE users SET address = ? WHERE id = ?").run(
    normalizedAddress,
    session.user.id
  );

  return NextResponse.json({ success: true, address: normalizedAddress });
}
