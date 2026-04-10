import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "db", "cybermusic.sqlite");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    // Run migrations if tables don't exist
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    if (!tables.find((t) => t.name === "users")) {
      const migration = fs.readFileSync(
        path.join(process.cwd(), "db", "migrations", "001_init.sql"),
        "utf-8"
      );
      db.exec(migration);
    }
    if (!tables.find((t) => t.name === "comments")) {
      const migration = fs.readFileSync(
        path.join(process.cwd(), "db", "migrations", "002_comments.sql"),
        "utf-8"
      );
      db.exec(migration);
    }
    // Migration 004: genre column
    const songCols = db.prepare("PRAGMA table_info(songs)").all() as { name: string }[];
    if (!songCols.find((c) => c.name === "genre")) {
      const migration = fs.readFileSync(
        path.join(process.cwd(), "db", "migrations", "004_genres.sql"),
        "utf-8"
      );
      db.exec(migration);
    }
    // Migration 005: plays column
    if (!songCols.find((c) => c.name === "plays")) {
      const migration = fs.readFileSync(
        path.join(process.cwd(), "db", "migrations", "005_plays.sql"),
        "utf-8"
      );
      db.exec(migration);
    }
    if (!tables.find((t) => t.name === "notifications")) {
      const migration = fs.readFileSync(
        path.join(process.cwd(), "db", "migrations", "003_notifications.sql"),
        "utf-8"
      );
      db.exec(migration);
    }
  }
  return db;
}

/** Convert a snake_case DB row to camelCase for the frontend */
export function toCamel(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
}

/** Convert an array of snake_case DB rows to camelCase */
export function toCamelAll(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => toCamel(r));
}
