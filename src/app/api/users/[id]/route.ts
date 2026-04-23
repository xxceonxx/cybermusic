import { NextResponse } from "next/server";
import { getDb, toCamel } from "@/lib/db";
import { withErrors, NotFound } from "@/lib/api-error";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const db = await getDb();

  const user = await db.first(
    "SELECT id, name, address, auth_provider, created_at FROM users WHERE id = ?",
    id
  );

  if (!user) throw NotFound();
  return NextResponse.json(toCamel(user));
});
