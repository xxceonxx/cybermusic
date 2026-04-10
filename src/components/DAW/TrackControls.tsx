"use client";

import { useRef } from "react";
import type { Track } from "@/types";

interface TrackControlsProps {
  track: Track;
  height: number;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  onVolumeChange: (vol: number) => void;
  onPanChange: (pan: number) => void;
  onMute: () => void;
  onSolo: () => void;
  onUpload?: (file: File) => void;
  onRecord?: () => void;
  recording?: boolean;
  onFx?: () => void;
  fxActive?: boolean;
  onDelete?: () => void;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
  isOwner: boolean;
}

const INSTRUMENT_COLORS: Record<string, string> = {
  Bass: "#3b82f6",
  AGuitar: "#ef4444",
  EGuitar: "#f97316",
  Drums: "#eab308",
  Harp: "#8b5cf6",
  Flute: "#ec4899",
  Percussion: "#f59e0b",
  Piano: "#7c3aed",
  Saxophone: "#ea580c",
  Triangle: "#06b6d4",
  Violine: "#d946ef",
  Vocals: "#10b981",
};

export function TrackControls({
  track,
  height,
  volume,
  muted,
  solo,
  onVolumeChange,
  onMute,
  onSolo,
  onUpload,
  onRecord,
  recording,
  onFx,
  fxActive,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragOver,
  isOwner,
}: TrackControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const color = INSTRUMENT_COLORS[track.instrument] ?? "#6b7280";

  return (
    <div
      className={`flex flex-col justify-center px-2 py-1.5 border-b transition-colors ${
        isDragOver
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-zinc-800/30 bg-zinc-900/70 hover:bg-zinc-900"
      }`}
      style={{ height }}
      draggable={!!onDragStart}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart?.(); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(); }}
      onDragEnd={() => onDragEnd?.()}
    >
      {/* Row 1: Instrument name + status */}
      <div className="flex items-center gap-1.5 mb-1">
        {onDragStart && (
          <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-500 transition">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor">
              <circle cx="1.5" cy="1.5" r="1" /><circle cx="4.5" cy="1.5" r="1" />
              <circle cx="1.5" cy="5" r="1" /><circle cx="4.5" cy="5" r="1" />
              <circle cx="1.5" cy="8.5" r="1" /><circle cx="4.5" cy="8.5" r="1" />
            </svg>
          </div>
        )}
        <div
          className="w-1 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium text-zinc-200 truncate">
          {track.instrument}
        </span>
        <span className="text-[9px] text-zinc-600 flex-shrink-0">
          {track.status === "uploaded" ? (
            <span className="text-emerald-500">ready</span>
          ) : track.status === "editing" ? (
            <span className="text-amber-500">
              {track.editorName ?? (track.editorAddress ? `${track.editorAddress.slice(0, 6)}...` : "edit")}
            </span>
          ) : (
            "open"
          )}
        </span>
        {/* Delete — far right */}
        {isOwner && onDelete && (
          <button
            onClick={onDelete}
            className="ml-auto w-4 h-4 flex items-center justify-center rounded text-zinc-700 hover:text-red-400 transition flex-shrink-0"
            title="Delete track"
          >
            <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        )}
      </div>

      {/* Row 2: M S FX Vol + actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onMute}
          className={`w-5 h-4 flex items-center justify-center text-[8px] font-bold rounded transition ${
            muted ? "bg-red-500/90 text-white" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}
          title="Mute"
        >M</button>
        <button
          onClick={onSolo}
          className={`w-5 h-4 flex items-center justify-center text-[8px] font-bold rounded transition ${
            solo ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}
          title="Solo"
        >S</button>
        {onFx && (
          <button
            onClick={onFx}
            className={`w-6 h-4 flex items-center justify-center text-[7px] font-bold rounded transition ${
              fxActive ? "bg-purple-500 text-white" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
            title="Effects"
          >FX</button>
        )}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          className="w-12 h-1 accent-emerald-500 cursor-pointer flex-shrink"
          title={`Volume: ${Math.round(volume * 100)}%`}
        />

        {/* Record + Upload */}
        {isOwner && track.status !== "uploaded" && onRecord && (
          <button
            onClick={onRecord}
            className={`w-4 h-4 flex items-center justify-center rounded transition ${
              recording ? "bg-red-500 text-white animate-pulse" : "bg-zinc-800 text-red-400 hover:bg-red-500/20"
            }`}
            title={recording ? "Stop" : "Record"}
          >
            <div className={`rounded-full ${recording ? "w-1.5 h-1.5 bg-white" : "w-2 h-2 bg-red-400"}`} />
          </button>
        )}
        {isOwner && track.status !== "uploaded" && onUpload && (
          <>
            <input ref={fileRef} type="file" accept="audio/*" onChange={() => { if (fileRef.current?.files?.[0]) onUpload(fileRef.current.files[0]); }} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-4 h-4 flex items-center justify-center rounded bg-blue-600/80 hover:bg-blue-500 transition text-white"
              title="Upload"
            >
              <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2l4 4h-3v5H7V6H4l4-4zM2 12h12v2H2z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
