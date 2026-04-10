"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { AddTrackDialog } from "@/components/Song/AddTrackDialog";
import { CreateNFT } from "@/components/Song/CreateNFT";
import { ExportPanel } from "@/components/Song/ExportPanel";
import { Comments } from "@/components/Song/Comments";
import { useToast } from "@/components/ui/Toast";
import type { Song, Track } from "@/types";

// DAW uses WaveSurfer which needs browser APIs — load client-only
const DAW = dynamic(() => import("@/components/DAW/DAW").then((m) => m.DAW), {
  ssr: false,
  loading: () => (
    <div className="h-40 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500">
      Loading DAW...
    </div>
  ),
});

type SongWithTracks = Song & { tracks: Track[] };

export default function SongDetail() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const { fetchSong } = useApi();
  const { toast } = useToast();
  const [song, setSong] = useState<SongWithTracks | null>(null);
  const [showAddTrack, setShowAddTrack] = useState(false);

  const songId = Number(params.id);
  const isOwner = userId === song?.creatorId;

  useEffect(() => {
    if (songId) {
      fetchSong(songId).then(setSong).catch(() => router.push("/discover"));
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="text-zinc-400 hover:text-white mb-6 text-sm"
      >
        &larr; Back
      </button>

      {/* Song Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {song.image && (
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={song.image}
                alt={song.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{song.name}</h1>
            <p className="text-zinc-400 text-sm mt-0.5">
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
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast("Link copied!", "success");
            }}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition"
            title="Copy share link"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline -mt-0.5 mr-1">
              <path d="M6 10l4-4M6.5 4.5L8 3a3 3 0 1 1 4.24 4.24L10.5 9M9.5 11.5L8 13a3 3 0 1 1-4.24-4.24L5.5 7" />
            </svg>
            Share
          </button>
          {isOwner && song.status === "open" && (
            <button
              onClick={() => setShowAddTrack(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition"
            >
              + Add Track
            </button>
          )}
        </div>
      </div>

      {/* DAW */}
      <DAW
        tracks={song.tracks}
        songId={songId}
        duration={song.duration}
        isOwner={isOwner}
        onTrackUpdated={handleTrackUpdated}
        onTrackDeleted={handleTrackDeleted}
      />

      {/* Export / Import */}
      <ExportPanel song={song} tracks={song.tracks} />

      {/* Comments */}
      <Comments songId={songId} />

      {/* NFT Mint Section */}
      {isOwner && <CreateNFT song={song} tracks={song.tracks} />}

      {/* Add Track Dialog */}
      <AddTrackDialog
        open={showAddTrack}
        onClose={() => setShowAddTrack(false)}
        songId={songId}
        onAdded={handleTrackAdded}
      />
    </div>
  );
}
