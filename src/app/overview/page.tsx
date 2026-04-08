"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { SongList } from "@/components/Song/SongList";
import type { Song } from "@/types";

export default function Overview() {
  const { fetchSongs } = useApi();
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    fetchSongs().then(setSongs);
  }, [fetchSongs]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Songs</h1>
      <SongList songs={songs} />
    </div>
  );
}
