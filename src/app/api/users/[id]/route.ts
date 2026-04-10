import { NextRequest, NextResponse } from "next/server";
import { getDb, toCamel } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const user = db
    .prepare("SELECT id, name, address, auth_provider, created_at FROM users WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(toCamel(user));
}
