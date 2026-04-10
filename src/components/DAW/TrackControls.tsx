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
  pan,
  muted,
  solo,
  onVolumeChange,
  onPanChange,
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
      className={`flex items-center gap-2 px-2 border-b transition-colors ${
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
      {/* Drag handle */}
      {onDragStart && (
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-500 transition">
          <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
            <circle cx="2" cy="2" r="1.2" /><circle cx="6" cy="2" r="1.2" />
            <circle cx="2" cy="7" r="1.2" /><circle cx="6" cy="7" r="1.2" />
            <circle cx="2" cy="12" r="1.2" /><circle cx="6" cy="12" r="1.2" />
          </svg>
        </div>
      )}
      {/* Color indicator + instrument */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        <div
          className="w-1 rounded-full flex-shrink-0"
          style={{ height: height - 20, backgroundColor: color }}
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-200 truncate leading-tight">
            {track.instrument}
          </p>
          <p className="text-[9px] text-zinc-600 leading-tight mt-0.5">
            {track.status === "uploaded" ? (
              <span className="text-emerald-500">ready</span>
            ) : track.status === "editing" ? (
              <span className="text-amber-500">
                {track.editorName ?? (track.editorAddress ? `${track.editorAddress.slice(0, 6)}...` : "editing")}
              </span>
            ) : (
              <span>open</span>
            )}
          </p>
        </div>
      </div>

      {/* Controls cluster */}
      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
        {/* M/S buttons */}
        <button
          onClick={onMute}
          className={`w-5 h-5 flex items-center justify-center text-[9px] font-bold rounded transition ${
            muted
              ? "bg-red-500/90 text-white"
              : "bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
          }`}
          title="Mute"
        >
          M
        </button>
        <button
          onClick={onSolo}
          className={`w-5 h-5 flex items-center justify-center text-[9px] font-bold rounded transition ${
            solo
              ? "bg-amber-500 text-black"
              : "bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
          }`}
          title="Solo"
        >
          S
        </button>

        {/* FX button */}
        {onFx && (
          <button
            onClick={onFx}
            className={`w-5 h-5 flex items-center justify-center text-[8px] font-bold rounded transition ${
              fxActive
                ? "bg-purple-500 text-white"
                : "bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
            }`}
            title="Effects"
          >
            FX
          </button>
        )}

        {/* Volume slider */}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          className="w-14 h-1 accent-emerald-500 cursor-pointer"
          title={`Volume: ${Math.round(volume * 100)}%`}
        />

        {/* Actions */}
        {isOwner && track.status !== "uploaded" && onRecord && (
          <button
            onClick={onRecord}
            className={`w-5 h-5 flex items-center justify-center rounded transition ${
              recording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-zinc-800 text-red-400 hover:bg-red-500/20"
            }`}
            title={recording ? "Stop recording" : "Record"}
          >
            <div className={`rounded-full ${recording ? "w-2 h-2 bg-white" : "w-2.5 h-2.5 bg-red-400"}`} />
          </button>
        )}
        {isOwner && track.status !== "uploaded" && onUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              onChange={() => {
                if (fileRef.current?.files?.[0]) {
                  onUpload(fileRef.current.files[0]);
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-5 h-5 flex items-center justify-center rounded bg-blue-600/80 hover:bg-blue-500 transition text-white"
              title="Upload audio"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2l4 4h-3v5H7V6H4l4-4zM2 12h12v2H2z" />
              </svg>
            </button>
          </>
        )}
        {isOwner && onDelete && (
          <button
            onClick={onDelete}
            className="w-5 h-5 flex items-center justify-center rounded text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition"
            title="Delete track"
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5 2V1h6v1h4v2H1V2h4zm1 4v7h4V6H6zm-3 9h10l1-9H3l1 9z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
