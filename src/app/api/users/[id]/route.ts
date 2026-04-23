import { NextResponse } from "next/server";
import { getDb, toCamel } from "@/lib/db";
import { withErrors, NotFound } from "@/lib/api-error";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const db = getDb();

  const user = db
    .prepare(
      "SELECT id, name, address, auth_provider, created_at FROM users WHERE id = ?"
    )
    .get(id) as Record<string, unknown> | undefined;

  if (!user) throw NotFound();
  return NextResponse.json(toCamel(user));
});
