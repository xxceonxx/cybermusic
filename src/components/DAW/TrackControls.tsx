"use client";

import { useRef } from "react";
import type { Track } from "@/types";

interface TrackControlsProps {
  track: Track;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  onVolumeChange: (vol: number) => void;
  onPanChange: (pan: number) => void;
  onMute: () => void;
  onSolo: () => void;
  onUpload?: () => void;
  onDelete?: () => void;
  isOwner: boolean;
}

export function TrackControls({
  track,
  volume,
  pan,
  muted,
  solo,
  onVolumeChange,
  onPanChange,
  onMute,
  onSolo,
  onUpload,
  onDelete,
  isOwner,
}: TrackControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const statusColor =
    track.status === "uploaded"
      ? "bg-green-500"
      : track.status === "editing"
      ? "bg-yellow-500"
      : "bg-zinc-600";

  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-900 border-b border-zinc-800 min-h-[80px]">
      {/* Instrument image + name */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/instruments/${track.instrument}.jpg`}
          alt={track.instrument}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-20 flex-shrink-0">
        <p className="text-sm font-medium truncate">{track.instrument}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
          <span className="text-[10px] text-zinc-500">{track.status}</span>
        </div>
      </div>

      {/* Mute / Solo */}
      <div className="flex flex-col gap-1">
        <button
          onClick={onMute}
          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
            muted ? "bg-red-600 text-white" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
          }`}
        >
          M
        </button>
        <button
          onClick={onSolo}
          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
            solo ? "bg-yellow-500 text-black" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
          }`}
        >
          S
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[10px] text-zinc-500 w-6">Vol</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          className="w-20 accent-green-500 h-1"
        />
        <span className="text-[10px] text-zinc-500 w-7">
          {Math.round(volume * 100)}
        </span>
      </div>

      {/* Pan */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[10px] text-zinc-500 w-6">Pan</span>
        <input
          type="range"
          min={-100}
          max={100}
          value={Math.round(pan * 100)}
          onChange={(e) => onPanChange(Number(e.target.value) / 100)}
          className="w-16 accent-blue-500 h-1"
        />
        <span className="text-[10px] text-zinc-500 w-5">
          {pan === 0 ? "C" : pan > 0 ? "R" : "L"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto">
        {isOwner && track.status !== "uploaded" && onUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              onChange={() => {
                if (fileRef.current?.files?.[0]) onUpload();
              }}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-2 py-1 text-[10px] bg-blue-600 hover:bg-blue-500 rounded"
            >
              Upload
            </button>
          </>
        )}
        {isOwner && onDelete && (
          <button
            onClick={onDelete}
            className="px-2 py-1 text-[10px] text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-400/50 rounded"
          >
            Del
          </button>
        )}
      </div>
    </div>
  );
}
