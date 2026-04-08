"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { NewSongDialog } from "@/components/Song/NewSongDialog";
import { SongList } from "@/components/Song/SongList";
import type { Song } from "@/types";

export default function Dashboard() {
  const { data: session } = useSession();
  const { fetchSongs } = useApi();
  const [songs, setSongs] = useState<Song[]>([]);
  const [showNewSong, setShowNewSong] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSongs(session.user.id).then(setSongs);
    }
  }, [session, fetchSongs]);

  const handleSongCreated = (song: Song) => {
    setSongs((prev) => [song, ...prev]);
    setShowNewSong(false);
  };

  if (!session) {
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

      <SongList songs={songs} onDelete={(id) => setSongs(songs.filter(s => s.id !== id))} />

      <NewSongDialog
        open={showNewSong}
        onClose={() => setShowNewSong(false)}
        onCreated={handleSongCreated}
      />
    </div>
  );
}
