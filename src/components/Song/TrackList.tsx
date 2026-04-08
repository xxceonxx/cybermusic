"use client";

import { useRef } from "react";
import { useApi } from "@/hooks/useApi";
import { useIpfs } from "@/hooks/useIpfs";
import type { Track } from "@/types";

interface TrackListProps {
  tracks: Track[];
  isOwner: boolean;
  songId: number;
  onTrackUpdated: (track: Track) => void;
  onTrackDeleted: (trackId: number) => void;
}

function TrackRow({
  track,
  isOwner,
  onUpdated,
  onDeleted,
}: {
  track: Track;
  isOwner: boolean;
  onUpdated: (track: Track) => void;
  onDeleted: (trackId: number) => void;
}) {
  const { uploadTrack, deleteTrack } = useApi();
  const { uploading, uploadFile } = useIpfs();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { url } = await uploadFile(file);
    const updated = await uploadTrack(track.id, url);
    onUpdated(updated);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this track?")) return;
    await deleteTrack(track.id);
    onDeleted(track.id);
  };

  const statusColor =
    track.status === "uploaded"
      ? "bg-green-500"
      : track.status === "editing"
      ? "bg-yellow-500"
      : "bg-zinc-600";

  return (
    <div className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
      {/* Instrument image */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/instruments/${track.instrument}-md.jpg`}
          alt={track.instrument}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium">{track.instrument}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-zinc-400">{track.status}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${statusColor} transition-all`}
          style={{
            width: track.status === "uploaded" ? "100%" : track.status === "editing" ? "50%" : "0%",
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {(isOwner || track.status === "editing") && track.status !== "uploaded" && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 rounded-md transition"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </>
        )}
        {isOwner && (
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-400/50 rounded-md transition"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export function TrackList({
  tracks,
  isOwner,
  songId,
  onTrackUpdated,
  onTrackDeleted,
}: TrackListProps) {
  if (tracks.length === 0) {
    return (
      <p className="text-zinc-500 text-center py-8">
        No tracks yet. {isOwner ? "Add an instrument to get started!" : ""}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-300">
        Tracks ({tracks.length})
      </h2>
      {tracks.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          isOwner={isOwner}
          onUpdated={onTrackUpdated}
          onDeleted={onTrackDeleted}
        />
      ))}
    </div>
  );
}
