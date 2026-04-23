import { getDb } from "./db";

export async function createNotification(
  userId: string,
  type: string,
  message: string,
  songId?: number
): Promise<void> {
  const db = await getDb();
  await db.run(
    "INSERT INTO notifications (user_id, type, message, song_id) VALUES (?, ?, ?, ?)",
    userId,
    type,
    message,
    songId ?? null
  );
}
