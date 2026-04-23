"use client";

import { useRef } from "react";
import type { Track } from "@/types";
import { getTrackColor, TRACK_HEIGHT } from "./colors";

interface TrackRowProps {
  track: Track;
  index: number;
  volume: number;
  muted: boolean;
  solo: boolean;
  isOwner: boolean;
  isDimmed: boolean;
  isDragOver: boolean;
  isUploading: boolean;
  isRecording: boolean;
  recordingTime: number;
  bpm: number;
  timelineDuration: number;
  onWaveformMount: (el: HTMLDivElement | null) => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onUpload: (file: File) => void;
  onRecord: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  onDropFile: (file: File) => void;
  onDragFileOver: () => void;
  onDragFileLeave: () => void;
}

export function TrackRow({
  track,
  index,
  volume,
  muted,
  solo,
  isOwner,
  isDimmed,
  isDragOver,
  isUploading,
  isRecording,
  recordingTime,
  bpm,
  timelineDuration,
  onWaveformMount,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onUpload,
  onRecord,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDropFile,
  onDragFileOver,
  onDragFileLeave,
}: TrackRowProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const trackColor = getTrackColor(track.instrument, 1);

  return (
    <div
      className="border-b border-zinc-800/20 relative group"
      style={{
        height: TRACK_HEIGHT,
        background: index % 2 === 0 ? "#0a0a0c" : "#0d0d0f",
        opacity: isDimmed ? 0.3 : 1,
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragEnd={onDragEnd}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 z-[5]"
        style={{ backgroundColor: trackColor, opacity: 0.7 }}
      />

      <div
        className="absolute left-2 top-0 bottom-0 z-20 flex flex-col justify-between py-2 pointer-events-none"
        style={{ width: 140 }}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-sm font-semibold truncate" style={{ color: trackColor }}>
            {track.instrument}
          </span>
          {track.status === "uploaded" && <span className="text-emerald-500 text-xs">&#9679;</span>}
          {track.status === "editing" && <span className="text-amber-500 text-xs">&#9679;</span>}
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            onClick={onToggleMute}
            className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${
              muted ? "bg-red-500 text-white" : "bg-zinc-800/90 text-zinc-500 hover:text-zinc-200"
            }`}
          >
            M
          </button>
          <button
            onClick={onToggleSolo}
            className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${
              solo ? "bg-amber-500 text-black" : "bg-zinc-800/90 text-zinc-500 hover:text-zinc-200"
            }`}
          >
            S
          </button>

          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            className="w-16 h-1 accent-emerald-500 cursor-pointer"
            title={`Vol ${Math.round(volume * 100)}%`}
          />

          {isOwner && !track.ipfsUrl && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                onChange={() => {
                  const f = fileRef.current?.files?.[0];
                  if (f) onUpload(f);
                }}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800/90 hover:bg-blue-600 transition text-zinc-400 hover:text-white"
                title="Upload audio"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 2l4 4h-3v5H7V6H4l4-4zM2 12h12v2H2z" />
                </svg>
              </button>
              <button
                onClick={onRecord}
                className={`w-6 h-6 flex items-center justify-center rounded transition ${
                  isRecording ? "bg-red-500 animate-pulse" : "bg-zinc-800/90 hover:bg-zinc-700"
                }`}
                title={isRecording ? "Stop recording" : "Record"}
              >
                <div className={`rounded-full ${isRecording ? "w-2 h-2 bg-white" : "w-2.5 h-2.5 bg-red-400"}`} />
              </button>
            </>
          )}

          {isOwner && (
            <button
              onClick={onDelete}
              className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
              title="Delete track"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {isDimmed && muted && (
        <div className="absolute inset-0 z-[15] flex items-center justify-center pointer-events-none">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium bg-black/60 px-3 py-1 rounded">
            Muted
          </span>
        </div>
      )}

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent ${
            100 / Math.max(1, timelineDuration / (60 / bpm))
          }%)`,
        }}
      />

      {track.ipfsUrl ? (
        <div ref={onWaveformMount} className="w-full h-full" />
      ) : isRecording ? (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-400 font-medium font-mono">
              REC {Math.floor(recordingTime / 60)}:
              {Math.floor(recordingTime % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      ) : isUploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/5">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 animate-spin text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            <span className="text-sm text-blue-400">Uploading to IPFS...</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 animate-[indeterminate_1.5s_ease-in-out_infinite]"
              style={{ width: "40%" }}
            />
          </div>
        </div>
      ) : (
        <div
          className={`absolute inset-0 flex items-center justify-center transition-colors ${
            isDragOver ? "bg-emerald-500/10" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDragFileOver();
          }}
          onDragLeave={onDragFileLeave}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("audio/")) onDropFile(file);
          }}
        >
          <span className="text-sm text-zinc-600">
            {isDragOver ? "Drop audio file here" : "Drop audio or click upload"}
          </span>
        </div>
      )}
    </div>
  );
}
