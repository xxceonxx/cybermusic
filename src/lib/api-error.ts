import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { captureError } from "./sentry";

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const BadRequest = (msg = "Bad request", details?: unknown) =>
  new HttpError(400, msg, details);
export const Unauthorized = (msg = "Unauthorized") => new HttpError(401, msg);
export const Forbidden = (msg = "Forbidden") => new HttpError(403, msg);
export const NotFound = (msg = "Not found") => new HttpError(404, msg);
export const Conflict = (msg = "Conflict") => new HttpError(409, msg);
export const TooMany = (msg = "Too many requests", retryAfter?: number) =>
  new HttpError(429, msg, { retryAfter });

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response> | Response;

export function withErrors<Ctx = unknown>(h: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await h(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        const body: Record<string, unknown> = { error: err.message };
        if (err.details !== undefined) body.details = err.details;
        const res = NextResponse.json(body, { status: err.status });
        if (err.status === 429 && err.details && typeof err.details === "object") {
          const r = (err.details as { retryAfter?: number }).retryAfter;
          if (r) res.headers.set("Retry-After", String(r));
        }
        return res;
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: err.issues },
          { status: 400 }
        );
      }
      if (err instanceof SyntaxError && /JSON/i.test(err.message)) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
      console.error("[api-error]", err);
      captureError(err, { url: req.url, method: req.method });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
