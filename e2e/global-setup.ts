import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export const SEED = {
  userId: "e2e-user-0000-0000-0000-000000000001",
  songId: 9999,
  trackId: 9999,
  songName: "E2E Seed Song",
};

export default async function globalSetup() {
  const dbPath = process.env.CYBERMUSIC_DB_PATH;
  if (!dbPath) throw new Error("CYBERMUSIC_DB_PATH must be set for e2e");

  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  for (const file of fs.readdirSync(migrationsDir).sort()) {
    db.exec(fs.readFileSync(path.join(migrationsDir, file), "utf-8"));
  }

  db.prepare(
    "INSERT INTO users (id, name, auth_provider) VALUES (?, ?, 'email')"
  ).run(SEED.userId, "E2E User");

  db.prepare(
    "INSERT INTO songs (id, name, duration, bpm, image, creator_id, status) VALUES (?, ?, ?, ?, ?, ?, 'open')"
  ).run(SEED.songId, SEED.songName, 120, 120, "https://example.com/img.png", SEED.userId);

  db.prepare(
    "INSERT INTO tracks (id, song_id, instrument, creator_id, status) VALUES (?, ?, 'Bass', ?, 'open')"
  ).run(SEED.trackId, SEED.songId, SEED.userId);

  db.close();
}
