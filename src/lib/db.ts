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
  }
  return db;
}
