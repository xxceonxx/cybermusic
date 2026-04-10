CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
