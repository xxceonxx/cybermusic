import { getDb } from "./db";

export function createNotification(
  userId: string,
  type: string,
  message: string,
  songId?: number
) {
  const db = getDb();
  db.prepare(
    "INSERT INTO notifications (user_id, type, message, song_id) VALUES (?, ?, ?, ?)"
  ).run(userId, type, message, songId ?? null);
}
