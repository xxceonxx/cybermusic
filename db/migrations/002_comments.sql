CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_comments_song ON comments(song_id);
