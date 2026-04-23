import * as Sentry from "@sentry/nextjs";

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

export { Sentry };
