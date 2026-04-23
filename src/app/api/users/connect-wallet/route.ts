import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { withErrors, Conflict, Unauthorized } from "@/lib/api-error";
import { parseJson } from "@/lib/api-validate";
import { connectWalletSchema } from "@/lib/schemas";

export const PUT = withErrors(async (req) => {
  const session = await auth();
  if (!session?.user?.id) throw Unauthorized();

  const { address } = await parseJson(req, connectWalletSchema);
  const normalizedAddress = address.toLowerCase();
  const db = getDb();

  const existing = db
    .prepare("SELECT id FROM users WHERE address = ?")
    .get(normalizedAddress) as { id: string } | undefined;

  if (existing && existing.id !== session.user.id) {
    throw Conflict("Wallet already linked to another account");
  }

  db.prepare("UPDATE users SET address = ? WHERE id = ?").run(
    normalizedAddress,
    session.user.id
  );

  return NextResponse.json({ success: true, address: normalizedAddress });
});
