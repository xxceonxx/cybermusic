import path from "node:path";
import fs from "node:fs";

export interface RunResult {
  lastInsertId: number;
  changes: number;
}

export interface BatchStatement {
  sql: string;
  params?: unknown[];
}

export interface Db {
  first<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T | undefined>;
  all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]>;
  run(sql: string, ...params: unknown[]): Promise<RunResult>;
  batch(statements: BatchStatement[]): Promise<RunResult[]>;
}

interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { last_row_id: number; changes: number } }>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<{ meta: { last_row_id: number; changes: number } }[]>;
}

let sqliteSingleton: Db | null = null;

async function getCfBinding(): Promise<D1Database | null> {
  try {
    const mod = await import("@cloudflare/next-on-pages");
    const env = mod.getOptionalRequestContext()?.env as { DB?: D1Database } | undefined;
    return env?.DB ?? null;
  } catch {
    return null;
  }
}

function d1Adapter(db: D1Database): Db {
  return {
    async first<T>(sql: string, ...params: unknown[]) {
      const row = await db.prepare(sql).bind(...params).first<T>();
      return row ?? undefined;
    },
    async all<T>(sql: string, ...params: unknown[]) {
      const { results } = await db.prepare(sql).bind(...params).all<T>();
      return results;
    },
    async run(sql, ...params) {
      const { meta } = await db.prepare(sql).bind(...params).run();
      return { lastInsertId: meta.last_row_id, changes: meta.changes };
    },
    async batch(statements) {
      const prepared = statements.map((s) =>
        db.prepare(s.sql).bind(...(s.params ?? []))
      );
      const results = await db.batch(prepared);
      return results.map((r) => ({
        lastInsertId: r.meta.last_row_id,
        changes: r.meta.changes,
      }));
    },
  };
}

async function createSqliteAdapter(): Promise<Db> {
  const { default: Database } = await import("better-sqlite3");
  const DB_PATH = path.join(process.cwd(), "db", "cybermusic.sqlite");
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const tables = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as { name: string }[];
  const has = (n: string) => tables.find((t) => t.name === n);

  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  const runMigration = (file: string) =>
    sqlite.exec(fs.readFileSync(path.join(migrationsDir, file), "utf-8"));

  if (!has("users")) runMigration("001_init.sql");
  if (!has("comments")) runMigration("002_comments.sql");
  if (!has("notifications")) runMigration("003_notifications.sql");

  const songCols = sqlite.prepare("PRAGMA table_info(songs)").all() as {
    name: string;
  }[];
  if (!songCols.find((c) => c.name === "genre")) runMigration("004_genres.sql");
  if (!songCols.find((c) => c.name === "plays")) runMigration("005_plays.sql");

  return {
    async first<T>(sql: string, ...params: unknown[]) {
      return sqlite.prepare(sql).get(...params) as T | undefined;
    },
    async all<T>(sql: string, ...params: unknown[]) {
      return sqlite.prepare(sql).all(...params) as T[];
    },
    async run(sql, ...params) {
      const r = sqlite.prepare(sql).run(...params);
      return { lastInsertId: Number(r.lastInsertRowid), changes: r.changes };
    },
    async batch(statements) {
      const tx = sqlite.transaction((stmts: BatchStatement[]) => {
        return stmts.map((s) => {
          const r = sqlite.prepare(s.sql).run(...(s.params ?? []));
          return { lastInsertId: Number(r.lastInsertRowid), changes: r.changes };
        });
      });
      return tx(statements);
    },
  };
}

export async function getDb(): Promise<Db> {
  const d1 = await getCfBinding();
  if (d1) return d1Adapter(d1);
  if (!sqliteSingleton) sqliteSingleton = await createSqliteAdapter();
  return sqliteSingleton;
}

export function toCamel(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
}

export function toCamelAll(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => toCamel(r));
}
