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
  const { fetchSong, updateSong } = useApi();
  const { toast } = useToast();
  const [song, setSong] = useState<SongWithTracks | null>(null);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBpm, setEditBpm] = useState(120);

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
            {editing ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await updateSong(songId, { name: editName, bpm: editBpm } as Partial<Song>);
                    setSong((prev) => prev ? { ...prev, name: editName, bpm: editBpm } : prev);
                    setEditing(false);
                    toast("Song updated", "success");
                  } catch {
                    toast("Failed to update song", "error");
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl font-bold bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-500 w-48"
                  autoFocus
                />
                <input
                  type="number"
                  value={editBpm}
                  onChange={(e) => setEditBpm(Number(e.target.value))}
                  min={60}
                  max={300}
                  className="w-16 text-sm bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-500"
                />
                <span className="text-xs text-zinc-500">BPM</span>
                <button type="submit" className="px-2 py-1 bg-emerald-600 rounded text-xs font-medium">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="px-2 py-1 text-xs text-zinc-500 hover:text-white">Cancel</button>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{song.name}</h1>
                  {isOwner && song.status === "open" && (
                    <button
                      onClick={() => { setEditName(song.name); setEditBpm(song.bpm); setEditing(true); }}
                      className="text-zinc-600 hover:text-zinc-400 transition"
                      title="Edit song"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
                      </svg>
                    </button>
                  )}
                </div>
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
              </>
            )}
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
          <button
            onClick={async () => {
              try {
                const res = await fetch(`/api/songs/${songId}/fork`, {
                  method: "POST",
                  headers: userId ? { "x-user-id": userId } : {},
                });
                if (!res.ok) throw new Error();
                const forked = await res.json();
                toast("Remix created!", "success");
                router.push(`/song/${forked.id}`);
              } catch {
                toast("Failed to create remix", "error");
              }
            }}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition"
            title="Create a remix of this song"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline -mt-0.5 mr-1">
              <path d="M5 3v4m0 0L3 5m2 2l2-2M11 13V9m0 0l2 2m-2-2l-2 2M3 9h4a2 2 0 0 0 2-2V3M13 7h-4a2 2 0 0 0-2 2v4" />
            </svg>
            Remix
          </button>
          {isOwner && song.status !== "minted" && (
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
        bpm={song.bpm}
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
