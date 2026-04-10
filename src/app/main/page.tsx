"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { NewSongDialog } from "@/components/Song/NewSongDialog";
import { SongList } from "@/components/Song/SongList";
import { SongGridSkeleton } from "@/components/ui/Skeleton";
import type { Song } from "@/types";

export default function Dashboard() {
  const { isLoggedIn, userId, isLoading: authLoading } = useAuth();
  const { fetchSongs } = useApi();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSong, setShowNewSong] = useState(false);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      fetchSongs(userId).then(setSongs).finally(() => setLoading(false));
    }
  }, [userId, fetchSongs]);

  const handleSongCreated = (song: Song) => {
    setSongs((prev) => [song, ...prev]);
    setShowNewSong(false);
  };

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <SongGridSkeleton count={3} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center flex-1 text-zinc-500">
        Please login to access your dashboard
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Songs</h1>
        <button
          onClick={() => setShowNewSong(true)}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition"
        >
          + New Song
        </button>
      </div>

      {loading ? (
        <SongGridSkeleton count={3} />
      ) : (
        <SongList songs={songs} onDelete={(id) => setSongs(songs.filter(s => s.id !== id))} />
      )}

      <NewSongDialog
        open={showNewSong}
        onClose={() => setShowNewSong(false)}
        onCreated={handleSongCreated}
      />
    </div>
  );
}
