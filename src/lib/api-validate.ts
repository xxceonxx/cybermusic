import type { ZodType } from "zod";
import type { NextRequest } from "next/server";

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const raw = await req.json();
  return schema.parse(raw);
}

export function parseQuery<T>(req: NextRequest, schema: ZodType<T>): T {
  const obj: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    obj[k] = v;
  });
  return schema.parse(obj);
}
