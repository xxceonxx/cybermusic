"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApi } from "@/hooks/useApi";
import { TrackList } from "@/components/Song/TrackList";
import { AddTrackDialog } from "@/components/Song/AddTrackDialog";
import { CreateNFT } from "@/components/Song/CreateNFT";
import type { Song, Track } from "@/types";

type SongWithTracks = Song & { tracks: Track[] };

export default function SongDetail() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { fetchSong } = useApi();
  const [song, setSong] = useState<SongWithTracks | null>(null);
  const [showAddTrack, setShowAddTrack] = useState(false);

  const songId = Number(params.id);
  const isOwner = session?.user?.id === song?.creatorId;

  useEffect(() => {
    if (songId) {
      fetchSong(songId).then(setSong).catch(() => router.push("/overview"));
    }
  }, [songId, fetchSong, router]);

  if (!song) {
    return (
      <div className="flex items-center justify-center flex-1 text-zinc-500">
        Loading...
      </div>
    );
  }

  const handleTrackAdded = (track: Track) => {
    setSong((prev) =>
      prev ? { ...prev, tracks: [...prev.tracks, track] } : prev
    );
    setShowAddTrack(false);
  };

  const handleTrackUpdated = (updated: Track) => {
    setSong((prev) =>
      prev
        ? {
            ...prev,
            tracks: prev.tracks.map((t) => (t.id === updated.id ? updated : t)),
          }
        : prev
    );
  };

  const handleTrackDeleted = (trackId: number) => {
    setSong((prev) =>
      prev
        ? { ...prev, tracks: prev.tracks.filter((t) => t.id !== trackId) }
        : prev
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="text-zinc-400 hover:text-white mb-6 text-sm"
      >
        &larr; Back
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{song.name}</h1>
          <p className="text-zinc-400 mt-1">
            {song.bpm} BPM &middot; {song.duration}s &middot;{" "}
            <span
              className={
                song.status === "minted"
                  ? "text-green-400"
                  : song.status === "open"
                  ? "text-yellow-400"
                  : "text-blue-400"
              }
            >
              {song.status}
            </span>
          </p>
        </div>
        {isOwner && song.status === "open" && (
          <button
            onClick={() => setShowAddTrack(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition"
          >
            + Add Track
          </button>
        )}
      </div>

      <TrackList
        tracks={song.tracks}
        isOwner={isOwner}
        songId={songId}
        onTrackUpdated={handleTrackUpdated}
        onTrackDeleted={handleTrackDeleted}
      />

      {isOwner && <CreateNFT song={song} tracks={song.tracks} />}

      <AddTrackDialog
        open={showAddTrack}
        onClose={() => setShowAddTrack(false)}
        songId={songId}
        onAdded={handleTrackAdded}
      />
    </div>
  );
}
