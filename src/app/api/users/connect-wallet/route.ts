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
  const db = await getDb();

  const existing = await db.first<{ id: string }>(
    "SELECT id FROM users WHERE address = ?",
    normalizedAddress
  );

  if (existing && existing.id !== session.user.id) {
    throw Conflict("Wallet already linked to another account");
  }

  await db.run(
    "UPDATE users SET address = ? WHERE id = ?",
    normalizedAddress,
    session.user.id
  );

  return NextResponse.json({ success: true, address: normalizedAddress });
});
